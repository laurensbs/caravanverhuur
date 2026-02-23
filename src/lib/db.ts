import { createPool, type VercelPool } from '@vercel/postgres';

let _pool: VercelPool | null = null;

function getPool() {
  if (!_pool) {
    _pool = createPool({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    });
  }
  return _pool;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sql(strings: TemplateStringsArray, ...values: any[]) {
  return getPool().sql(strings, ...values);
}

// ===== DATABASE SETUP =====

export async function setupDatabase() {
  // Bookings table
  await sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      reference TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      status TEXT NOT NULL DEFAULT 'NIEUW',
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      guest_phone TEXT NOT NULL,
      adults INTEGER NOT NULL DEFAULT 2,
      children INTEGER NOT NULL DEFAULT 0,
      special_requests TEXT,
      caravan_id TEXT NOT NULL,
      camping_id TEXT NOT NULL,
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      nights INTEGER NOT NULL,
      total_price NUMERIC(10,2) NOT NULL,
      deposit_amount NUMERIC(10,2) NOT NULL,
      remaining_amount NUMERIC(10,2) NOT NULL,
      borg_amount NUMERIC(10,2) NOT NULL,
      admin_notes TEXT
    )
  `;

  // Payments table
  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      amount NUMERIC(10,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPENSTAAND',
      method TEXT NOT NULL DEFAULT 'bank',
      stripe_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      paid_at TIMESTAMP
    )
  `;

  // Contact submissions table
  await sql`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMP DEFAULT NOW(),
      status TEXT NOT NULL DEFAULT 'NIEUW',
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      admin_reply TEXT
    )
  `;

  // Caravan settings table (availability, notes)
  await sql`
    CREATE TABLE IF NOT EXISTS caravan_settings (
      caravan_id TEXT PRIMARY KEY,
      available BOOLEAN NOT NULL DEFAULT true,
      status TEXT NOT NULL DEFAULT 'BESCHIKBAAR',
      admin_notes TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  return { success: true, message: 'Database tables created successfully' };
}

// ===== HELPERS =====

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function generateBookingReference(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await sql`
    SELECT COUNT(*) as count FROM bookings 
    WHERE reference LIKE ${'BK-' + year + '-%'}
  `;
  const count = parseInt(result.rows[0].count) + 1;
  return `BK-${year}-${count.toString().padStart(3, '0')}`;
}

// ===== BOOKING QUERIES =====

export async function createBooking(data: {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  adults: number;
  children: number;
  specialRequests?: string;
  caravanId: string;
  campingId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  depositAmount: number;
  remainingAmount: number;
  borgAmount: number;
}) {
  const id = generateId('B');
  const reference = await generateBookingReference();

  await sql`
    INSERT INTO bookings (id, reference, status, guest_name, guest_email, guest_phone, adults, children, special_requests, caravan_id, camping_id, check_in, check_out, nights, total_price, deposit_amount, remaining_amount, borg_amount)
    VALUES (${id}, ${reference}, 'NIEUW', ${data.guestName}, ${data.guestEmail}, ${data.guestPhone}, ${data.adults}, ${data.children}, ${data.specialRequests || null}, ${data.caravanId}, ${data.campingId}, ${data.checkIn}, ${data.checkOut}, ${data.nights}, ${data.totalPrice}, ${data.depositAmount}, ${data.remainingAmount}, ${data.borgAmount})
  `;

  // Create the initial deposit payment record
  const paymentId = generateId('P');
  await sql`
    INSERT INTO payments (id, booking_id, type, amount, status, method)
    VALUES (${paymentId}, ${id}, 'AANBETALING', ${data.depositAmount}, 'OPENSTAAND', 'bank')
  `;

  return { id, reference };
}

export async function getAllBookings() {
  const result = await sql`
    SELECT * FROM bookings ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function getBookingById(id: string) {
  const result = await sql`
    SELECT * FROM bookings WHERE id = ${id}
  `;
  return result.rows[0] || null;
}

export async function updateBookingStatus(id: string, status: string) {
  await sql`
    UPDATE bookings SET status = ${status} WHERE id = ${id}
  `;
}

export async function updateBookingNotes(id: string, notes: string) {
  await sql`
    UPDATE bookings SET admin_notes = ${notes} WHERE id = ${id}
  `;
}

// ===== PAYMENT QUERIES =====

export async function getPaymentsByBookingId(bookingId: string) {
  const result = await sql`
    SELECT * FROM payments WHERE booking_id = ${bookingId} ORDER BY created_at ASC
  `;
  return result.rows;
}

export async function getAllPayments() {
  const result = await sql`
    SELECT p.*, b.guest_name, b.reference as booking_ref, b.caravan_id
    FROM payments p
    JOIN bookings b ON p.booking_id = b.id
    ORDER BY p.created_at DESC
  `;
  return result.rows;
}

export async function updatePaymentStatus(id: string, status: string, paidAt?: string) {
  if (paidAt) {
    await sql`
      UPDATE payments SET status = ${status}, paid_at = ${paidAt} WHERE id = ${id}
    `;
  } else {
    await sql`
      UPDATE payments SET status = ${status} WHERE id = ${id}
    `;
  }
}

export async function createPayment(data: {
  bookingId: string;
  type: string;
  amount: number;
  status?: string;
  method?: string;
}) {
  const id = generateId('P');
  await sql`
    INSERT INTO payments (id, booking_id, type, amount, status, method)
    VALUES (${id}, ${data.bookingId}, ${data.type}, ${data.amount}, ${data.status || 'OPENSTAAND'}, ${data.method || 'bank'})
  `;
  return { id };
}

// ===== CONTACT QUERIES =====

export async function createContact(data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  const id = generateId('C');
  await sql`
    INSERT INTO contacts (id, name, email, phone, subject, message)
    VALUES (${id}, ${data.name}, ${data.email}, ${data.phone || null}, ${data.subject}, ${data.message})
  `;
  return { id };
}

export async function getAllContacts() {
  const result = await sql`
    SELECT * FROM contacts ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function updateContactStatus(id: string, status: string) {
  await sql`
    UPDATE contacts SET status = ${status} WHERE id = ${id}
  `;
}

export async function replyToContact(id: string, reply: string) {
  await sql`
    UPDATE contacts SET status = 'BEANTWOORD', admin_reply = ${reply} WHERE id = ${id}
  `;
}

// ===== DASHBOARD STATS =====

export async function getDashboardStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

  const [bookingsResult, paymentsResult, contactsResult, monthlyResult] = await Promise.all([
    sql`SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status NOT IN ('GEANNULEERD', 'AFGEROND')) as active,
      COUNT(*) FILTER (WHERE status = 'NIEUW') as new
    FROM bookings`,
    sql`SELECT 
      COALESCE(SUM(amount) FILTER (WHERE status = 'BETAALD'), 0) as total_paid,
      COUNT(*) FILTER (WHERE status = 'BETAALD') as paid_count,
      COALESCE(SUM(amount) FILTER (WHERE status = 'OPENSTAAND'), 0) as total_open,
      COUNT(*) FILTER (WHERE status = 'OPENSTAAND') as open_count
    FROM payments`,
    sql`SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'NIEUW') as new
    FROM contacts`,
    sql`SELECT
      COUNT(*) as bookings_this_month,
      COALESCE(SUM(total_price), 0) as revenue_this_month
    FROM bookings
    WHERE created_at >= ${monthStart} AND created_at <= ${monthEnd}`,
  ]);

  return {
    bookings: bookingsResult.rows[0],
    payments: paymentsResult.rows[0],
    contacts: contactsResult.rows[0],
    monthly: monthlyResult.rows[0],
  };
}

export async function getRecentBookings(limit = 5) {
  const result = await sql`
    SELECT * FROM bookings ORDER BY created_at DESC LIMIT ${limit}
  `;
  return result.rows;
}

export async function getRecentContacts(limit = 3) {
  const result = await sql`
    SELECT * FROM contacts ORDER BY created_at DESC LIMIT ${limit}
  `;
  return result.rows;
}

export async function getUpcomingStays() {
  const result = await sql`
    SELECT * FROM bookings 
    WHERE status NOT IN ('GEANNULEERD', 'AFGEROND')
    ORDER BY check_in ASC
  `;
  return result.rows;
}

export async function getBookingsByCaravanId(caravanId: string) {
  const result = await sql`
    SELECT * FROM bookings 
    WHERE caravan_id = ${caravanId} AND status != 'GEANNULEERD'
    ORDER BY check_in ASC
  `;
  return result.rows;
}

// ===== CARAVAN SETTINGS =====

export async function getCaravanSettings() {
  const result = await sql`
    SELECT * FROM caravan_settings
  `;
  return result.rows;
}

export async function getCaravanSetting(caravanId: string) {
  const result = await sql`
    SELECT * FROM caravan_settings WHERE caravan_id = ${caravanId}
  `;
  return result.rows[0] || null;
}

export async function upsertCaravanSetting(caravanId: string, available: boolean, status: string, adminNotes?: string) {
  await sql`
    INSERT INTO caravan_settings (caravan_id, available, status, admin_notes, updated_at)
    VALUES (${caravanId}, ${available}, ${status}, ${adminNotes || null}, NOW())
    ON CONFLICT (caravan_id) DO UPDATE SET
      available = ${available},
      status = ${status},
      admin_notes = ${adminNotes || null},
      updated_at = NOW()
  `;
}

export async function getAvailableCaravanIds() {
  // Returns IDs of caravans that are NOT explicitly set to unavailable
  const result = await sql`
    SELECT caravan_id FROM caravan_settings WHERE available = false
  `;
  return result.rows.map(r => r.caravan_id);
}
