// Client-safe URL builders for Holded deep-links. Kept in a separate file
// from lib/holded.ts because that one imports env vars + does server-side
// fetches, which would leak into the client bundle.

// Format confirmed against Holded's actual UI:
//   https://app.holded.com/sales/proforms#open:proform-<id>
// (NOT app.holded.com/invoicing/documents/proforms/<id> — that path 404s
// in the current Holded UI.)
export function holdedProformaAppUrl(invoiceId: string): string {
  return `https://app.holded.com/sales/proforms#open:proform-${invoiceId}`;
}
