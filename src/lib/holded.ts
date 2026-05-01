// ===== HOLDED INVOICING CLIENT =====
// Thin fetch-based wrapper around the Holded REST API.
// Used to auto-create + send a deposit invoice to the customer when a booking is made.
// API key wordt gelezen uit HOLDED_API_KEY env var.

const HOLDED_API_BASE = 'https://api.holded.com/api/invoicing/v1';

function getKey(): string {
  const key = process.env.HOLDED_API_KEY;
  if (!key) throw new Error('HOLDED_API_KEY is not set in environment variables');
  return key;
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

export interface HoldedAddress {
  street: string;
  postalCode: string;
  city: string;
  country?: string; // ISO country code, e.g. "NL"
}

export interface HoldedContactInput {
  name: string;
  email: string;
  phone?: string;
  address?: HoldedAddress;
}

function buildBillAddress(addr?: HoldedAddress) {
  if (!addr) return undefined;
  return {
    address: addr.street,
    postalCode: addr.postalCode,
    city: addr.city,
    country: addr.country || 'NL',
  };
}

// Find existing contact by email, or create a new one. Returns Holded contact id.
// If address is provided and the contact already exists without an address, the existing
// contact is updated with the address (so the invoice PDF will show it).
export async function findOrCreateHoldedContact(input: HoldedContactInput): Promise<string> {
  // Search by email
  try {
    const search = await holdedFetch(`/contacts?email=${encodeURIComponent(input.email)}`) as Array<{ id: string; email?: string; billAddress?: { address?: string } }>;
    if (Array.isArray(search) && search.length > 0 && search[0].id) {
      const existing = search[0];
      // If we have an address and the existing contact doesn't (or its billAddress.address is empty), update it
      if (input.address && !existing.billAddress?.address) {
        try {
          await holdedFetch(`/contacts/${existing.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              billAddress: buildBillAddress(input.address),
              phone: input.phone || '',
            }),
          });
        } catch (err) {
          console.warn('Holded contact address update failed (continuing):', err);
        }
      }
      return existing.id;
    }
  } catch (err) {
    console.warn('Holded contact search failed, will try to create:', err);
  }

  // Create new
  const body: Record<string, unknown> = {
    name: input.name,
    email: input.email,
    phone: input.phone || '',
    type: 'client',
    isperson: 1,
  };
  const billAddress = buildBillAddress(input.address);
  if (billAddress) body.billAddress = billAddress;

  const created = await holdedFetch('/contacts', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as { id?: string };
  if (!created?.id) throw new Error('Holded contact creation returned no id');
  return created.id;
}

// Update an existing Holded contact's billing address + phone.
export async function updateHoldedContactAddress(contactId: string, address: HoldedAddress, phone?: string): Promise<void> {
  await holdedFetch(`/contacts/${contactId}`, {
    method: 'PUT',
    body: JSON.stringify({
      billAddress: buildBillAddress(address),
      ...(phone ? { phone } : {}),
    }),
  });
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

// Markeer een Holded-factuur als (volledig) betaald. Verifieerd via API: POST naar /pay
// met date+amount voegt een payment-record toe en zet pending op 0.
export async function markHoldedInvoicePaid(invoiceId: string, amount?: number): Promise<void> {
  // Als amount niet meegegeven is, lees de factuur en gebruik het totaal.
  let amountToPay = amount;
  if (amountToPay === undefined) {
    const inv = await holdedFetch(`/documents/invoice/${invoiceId}`) as { total?: number; paymentsPending?: number };
    amountToPay = typeof inv.paymentsPending === 'number' && inv.paymentsPending > 0
      ? inv.paymentsPending
      : (inv.total || 0);
  }
  if (!amountToPay || amountToPay <= 0) return; // niets te betalen

  await holdedFetch(`/documents/invoice/${invoiceId}/pay`, {
    method: 'POST',
    body: JSON.stringify({
      date: Math.floor(Date.now() / 1000),
      amount: amountToPay,
    }),
  });
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

// Publieke betaal-/share-pagina van een Holded factuur. Deterministisch: Holded serveert
// op /documents/invoice/{id}/pay de online-invoice-widget (met Stripe-betaalknop indien
// geconfigureerd). Empirisch geverifieerd — de GET /documents/invoice/{id} response
// bevat geen URL-velden, dus we construeren 'm zelf.
export function buildHoldedInvoicePublicUrl(invoiceId: string): string {
  return `${HOLDED_API_BASE}/documents/invoice/${invoiceId}/pay`;
}

// Backwards-compat alias — async voor bestaande call sites die await gebruiken.
export async function getHoldedInvoicePublicUrl(invoiceId: string): Promise<string | undefined> {
  return buildHoldedInvoicePublicUrl(invoiceId);
}
