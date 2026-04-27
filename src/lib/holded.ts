// ===== HOLDED INVOICING CLIENT =====
// Thin fetch-based wrapper around the Holded REST API.
// Used to auto-create + send a deposit invoice to the customer when a booking is made.
// API key is read from HOLDED_API_KEY env var (with a fallback to the key the user shared).

const HOLDED_API_BASE = 'https://api.holded.com/api/invoicing/v1';
const HOLDED_CONTACTS_BASE = 'https://api.holded.com/api/invoicing/v1/contacts';
const FALLBACK_KEY = '5c5749a168a15ca925a58456590c47f9';

function getKey(): string {
  return process.env.HOLDED_API_KEY || FALLBACK_KEY;
}

async function holdedFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const url = path.startsWith('http') ? path : `${HOLDED_API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'key': getKey(),
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    throw new Error(`Holded API ${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }
  return data;
}

export interface HoldedContactInput {
  name: string;
  email: string;
  phone?: string;
}

// Find existing contact by email, or create a new one. Returns Holded contact id.
export async function findOrCreateHoldedContact(input: HoldedContactInput): Promise<string> {
  // Search by email
  try {
    const search = await holdedFetch(`/contacts?email=${encodeURIComponent(input.email)}`) as Array<{ id: string; email?: string }>;
    if (Array.isArray(search) && search.length > 0 && search[0].id) {
      return search[0].id;
    }
  } catch (err) {
    console.warn('Holded contact search failed, will try to create:', err);
  }

  // Create new
  const created = await holdedFetch('/contacts', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      phone: input.phone || '',
      type: 'client',
      isperson: 1,
    }),
  }) as { id?: string };
  if (!created?.id) throw new Error('Holded contact creation returned no id');
  return created.id;
}

export interface HoldedInvoiceItem {
  name: string;
  units: number;
  subtotal: number; // unit price excl. tax
  tax?: number; // percentage e.g. 21
}

export interface CreateHoldedInvoiceInput {
  contactId: string;
  reference: string; // booking reference, used as invoice notes/desc
  items: HoldedInvoiceItem[];
  notes?: string;
  // Optional: due date as unix timestamp (seconds)
  dueDate?: number;
}

export interface HoldedInvoiceResult {
  invoiceId: string;
  // Holded "Online invoice" public URL with embedded Stripe payment button (when enabled in Holded settings)
  publicUrl?: string;
  number?: string;
}

export async function createHoldedInvoice(input: CreateHoldedInvoiceInput): Promise<HoldedInvoiceResult> {
  const nowSec = Math.floor(Date.now() / 1000);
  const body: Record<string, unknown> = {
    contactId: input.contactId,
    desc: input.reference,
    notes: input.notes || '',
    date: nowSec, // Holded requires invoice date as unix timestamp (seconds)
    dueDate: input.dueDate || nowSec + 14 * 24 * 60 * 60, // default: due in 14 days
    approveDoc: 1, // approve immediately — without this the invoice stays as draft (not visible in main list, no docNumber)
    items: input.items.map((it) => ({
      name: it.name,
      units: it.units,
      subtotal: it.subtotal,
      tax: it.tax ?? 0,
    })),
  };

  const created = await holdedFetch('/documents/invoice', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as { id?: string; invoiceNum?: string; docNumber?: string; publicUrl?: string };

  if (!created?.id) throw new Error('Holded invoice creation returned no id');

  return {
    invoiceId: created.id,
    publicUrl: created.publicUrl,
    number: created.invoiceNum || created.docNumber,
  };
}

// Tell Holded to send the invoice email to the customer. Holded includes the Stripe payment link
// (provided the Stripe integration is configured in the Holded account).
export async function sendHoldedInvoice(invoiceId: string, email: string, subject?: string, message?: string): Promise<void> {
  await holdedFetch(`/documents/invoice/${invoiceId}/send`, {
    method: 'POST',
    body: JSON.stringify({
      emails: email,
      subject: subject || 'Factuur',
      message: message || '',
    }),
  });
}

export interface HoldedInvoiceStatus {
  id: string;
  status?: string | number;
  paid?: boolean;
  pending?: number;
  total?: number;
}

export async function getHoldedInvoice(invoiceId: string): Promise<HoldedInvoiceStatus> {
  const inv = await holdedFetch(`/documents/invoice/${invoiceId}`) as Record<string, unknown>;
  return {
    id: String(inv.id || invoiceId),
    status: inv.status as string | number | undefined,
    // Holded marks fully-paid invoices with status numeric code or "paid" pending == 0
    paid: (typeof inv.pending === 'number' && inv.pending === 0) || inv.status === 'paid' || inv.status === 1,
    pending: typeof inv.pending === 'number' ? inv.pending : undefined,
    total: typeof inv.total === 'number' ? inv.total : undefined,
  };
}

// Fetch the invoice PDF as a Buffer. Holded returns either { data: <base64> } or a binary stream
// depending on the endpoint variant; we handle both.
export async function getHoldedInvoicePdf(invoiceId: string): Promise<Buffer> {
  const url = `${HOLDED_API_BASE}/documents/invoice/${invoiceId}/pdf`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', 'key': getKey() },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Holded PDF API ${res.status}: ${text}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/pdf')) {
    return Buffer.from(await res.arrayBuffer());
  }
  const json = await res.json() as { data?: string; pdf?: string; status?: number };
  const b64 = json.data || json.pdf;
  if (!b64) throw new Error('Holded PDF response missing base64 data');
  return Buffer.from(b64, 'base64');
}

// Fetch the public-facing URL of an invoice (the "online invoice" page with Stripe pay button).
// Holded sometimes returns this in `publicUrl`, sometimes in `url`, sometimes only after explicitly
// requesting a public link. We try a few likely fields; returns undefined if not available.
export async function getHoldedInvoicePublicUrl(invoiceId: string): Promise<string | undefined> {
  try {
    const inv = await holdedFetch(`/documents/invoice/${invoiceId}`) as Record<string, unknown>;
    const candidates = [
      inv.publicUrl,
      inv.url,
      (inv.shareLink as Record<string, unknown> | undefined)?.url,
      inv.shareUrl,
    ];
    for (const c of candidates) {
      if (typeof c === 'string' && c.startsWith('http')) return c;
    }
  } catch (err) {
    console.warn('Failed to fetch Holded invoice public URL:', err);
  }
  return undefined;
}
