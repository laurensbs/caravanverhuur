// ===== HOLDED PROFORMA CLIENT =====
// IMPORTANT: we create PROFORMA documents (not invoices) in Holded. Final invoices are
// only ever created MANUALLY by the team after manual review. Even when a payment is
// received, we DO NOT promote a proforma to a real invoice via the API — `markHoldedProformaPaid`
// just records the payment against the proforma so we can see in Holded that it's been paid.
//
// The `Invoice` naming in some exported types/functions is preserved for backwards
// compatibility with call sites; they all operate on /documents/proform now.

import * as Sentry from '@sentry/nextjs';

const HOLDED_API_BASE = 'https://api.holded.com/api/invoicing/v1';
const DOC_TYPE = 'proform'; // NEVER change to 'invoice' — see file-level note

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
    const err = new Error(`Holded API ${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
    Sentry.captureException(err, {
      tags: { integration: 'holded', status: String(res.status) },
      extra: { path },
    });
    throw err;
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
// contact is updated with the address (so the proforma PDF will show it).
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
  reference: string; // booking reference, used as document notes/desc
  items: HoldedInvoiceItem[];
  notes?: string;
  // Optional: due date as unix timestamp (seconds)
  dueDate?: number;
}

export interface HoldedInvoiceResult {
  invoiceId: string; // proforma id (kept name for backwards compat with call sites)
  publicUrl?: string;
  number?: string; // proforma number, e.g. PRO260740
}

// Create a Holded PROFORMA (not an invoice). The proforma is approved on creation so it
// gets a docNumber but is still NOT a final invoice for accounting purposes.
export async function createHoldedInvoice(input: CreateHoldedInvoiceInput): Promise<HoldedInvoiceResult> {
  const nowSec = Math.floor(Date.now() / 1000);
  const body: Record<string, unknown> = {
    contactId: input.contactId,
    desc: input.reference,
    notes: input.notes || '',
    date: nowSec,
    dueDate: input.dueDate || nowSec + 14 * 24 * 60 * 60,
    approveDoc: 1,
    items: input.items.map((it) => ({
      name: it.name,
      units: it.units,
      subtotal: it.subtotal,
      tax: it.tax ?? 0,
    })),
  };

  const created = await holdedFetch(`/documents/${DOC_TYPE}`, {
    method: 'POST',
    body: JSON.stringify(body),
  }) as { id?: string; invoiceNum?: string; docNumber?: string; publicUrl?: string };

  if (!created?.id) throw new Error('Holded proforma creation returned no id');

  return {
    invoiceId: created.id,
    publicUrl: created.publicUrl,
    number: created.invoiceNum || created.docNumber,
  };
}

// Tell Holded to email the proforma to the customer. Holded includes the Stripe payment
// link if Stripe integration is configured. Used for occasional manual resends.
export async function sendHoldedInvoice(invoiceId: string, email: string, subject?: string, message?: string): Promise<void> {
  await holdedFetch(`/documents/${DOC_TYPE}/${invoiceId}/send`, {
    method: 'POST',
    body: JSON.stringify({
      emails: email,
      subject: subject || 'Pro forma',
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

// Record a payment against the proforma so the team can see it as paid in Holded.
// IMPORTANT: this does NOT convert the proforma to a final invoice — that step is
// always manual.
export async function markHoldedInvoicePaid(invoiceId: string, amount?: number): Promise<void> {
  let amountToPay = amount;
  if (amountToPay === undefined) {
    const inv = await holdedFetch(`/documents/${DOC_TYPE}/${invoiceId}`) as { total?: number; paymentsPending?: number };
    amountToPay = typeof inv.paymentsPending === 'number' && inv.paymentsPending > 0
      ? inv.paymentsPending
      : (inv.total || 0);
  }
  if (!amountToPay || amountToPay <= 0) return;

  await holdedFetch(`/documents/${DOC_TYPE}/${invoiceId}/pay`, {
    method: 'POST',
    body: JSON.stringify({
      date: Math.floor(Date.now() / 1000),
      amount: amountToPay,
    }),
  });
}

export async function getHoldedInvoice(invoiceId: string): Promise<HoldedInvoiceStatus> {
  const inv = await holdedFetch(`/documents/${DOC_TYPE}/${invoiceId}`) as Record<string, unknown>;
  return {
    id: String(inv.id || invoiceId),
    status: inv.status as string | number | undefined,
    paid: (typeof inv.pending === 'number' && inv.pending === 0) || inv.status === 'paid' || inv.status === 1,
    pending: typeof inv.pending === 'number' ? inv.pending : undefined,
    total: typeof inv.total === 'number' ? inv.total : undefined,
  };
}

// Fetch the proforma PDF as a Buffer.
export async function getHoldedInvoicePdf(invoiceId: string): Promise<Buffer> {
  const url = `${HOLDED_API_BASE}/documents/${DOC_TYPE}/${invoiceId}/pdf`;
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

// Deep link into the Holded admin app to open a specific proforma.
// Format confirmed against Holded's actual UI:
//   https://app.holded.com/sales/proforms#open:proform-<id>
// (NOT the api.holded.com endpoint — that's the backend API). This URL
// only works for logged-in Holded users; it's an internal team-link.
export function buildHoldedAppUrl(invoiceId: string): string {
  return `https://app.holded.com/sales/proforms#open:proform-${invoiceId}`;
}

// Backwards-compatible alias for older call sites.
export const buildHoldedInvoicePublicUrl = buildHoldedAppUrl;

// Backwards-compat alias — async for call sites that use await.
export async function getHoldedInvoicePublicUrl(invoiceId: string): Promise<string | undefined> {
  return buildHoldedInvoicePublicUrl(invoiceId);
}
