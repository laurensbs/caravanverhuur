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

  // Borg (deposit) checklists table
  await sql`
    CREATE TABLE IF NOT EXISTS borg_checklists (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'INCHECKEN',
      status TEXT NOT NULL DEFAULT 'OPEN',
      items JSONB DEFAULT '[]',
      general_notes TEXT,
      staff_name TEXT,
      customer_agreed BOOLEAN DEFAULT false,
      customer_agreed_at TIMESTAMP,
      customer_notes TEXT,
      token TEXT UNIQUE,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Customers table (login system)
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      last_login TIMESTAMP
    )
  `;

  // Customer sessions table
  await sql`
    CREATE TABLE IF NOT EXISTS customer_sessions (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
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

// ===== BORG CHECKLIST QUERIES =====

const BORG_CHECKLIST_ITEMS = [
  { category: 'Exterieur', item: 'Carrosserie (deuken, krassen)', status: 'nvt', notes: '' },
  { category: 'Exterieur', item: 'Wielen & banden', status: 'nvt', notes: '' },
  { category: 'Exterieur', item: 'Ramen & deuren', status: 'nvt', notes: '' },
  { category: 'Exterieur', item: 'Luifel / zonwering', status: 'nvt', notes: '' },
  { category: 'Exterieur', item: 'Koppeling & steunpoten', status: 'nvt', notes: '' },
  { category: 'Exterieur', item: 'Verlichting (achter, rem, richting)', status: 'nvt', notes: '' },
  { category: 'Interieur', item: 'Vloer & tapijt', status: 'nvt', notes: '' },
  { category: 'Interieur', item: 'Zitbanken & kussens', status: 'nvt', notes: '' },
  { category: 'Interieur', item: 'Gordijnen & rolgordijnen', status: 'nvt', notes: '' },
  { category: 'Interieur', item: 'Verlichting interieur', status: 'nvt', notes: '' },
  { category: 'Interieur', item: 'Verwarming / airco', status: 'nvt', notes: '' },
  { category: 'Keuken', item: 'Fornuis / gasvuur', status: 'nvt', notes: '' },
  { category: 'Keuken', item: 'Koelkast', status: 'nvt', notes: '' },
  { category: 'Keuken', item: 'Servies & bestek (compleet)', status: 'nvt', notes: '' },
  { category: 'Keuken', item: 'Pannen & kookgerei', status: 'nvt', notes: '' },
  { category: 'Sanitair', item: 'Toilet', status: 'nvt', notes: '' },
  { category: 'Sanitair', item: 'Waterpompen', status: 'nvt', notes: '' },
  { category: 'Sanitair', item: 'Waterreservoirs (schoon/vuil)', status: 'nvt', notes: '' },
  { category: 'Slaapplaatsen', item: 'Matrassen', status: 'nvt', notes: '' },
  { category: 'Slaapplaatsen', item: 'Beddengoed & kussens', status: 'nvt', notes: '' },
  { category: 'Technisch', item: 'Gasinstallatie', status: 'nvt', notes: '' },
  { category: 'Technisch', item: 'Elektra & accu / 230V', status: 'nvt', notes: '' },
  { category: 'Technisch', item: 'Waterleidingen', status: 'nvt', notes: '' },
  { category: 'Inventaris', item: 'Handdoeken', status: 'nvt', notes: '' },
  { category: 'Inventaris', item: 'Schoonmaakmiddelen', status: 'nvt', notes: '' },
  { category: 'Inventaris', item: 'Gereedschap / EHBO', status: 'nvt', notes: '' },
];

export function getDefaultBorgItems() {
  return JSON.parse(JSON.stringify(BORG_CHECKLIST_ITEMS));
}

function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function createBorgChecklist(data: {
  bookingId: string;
  type: string;
  staffName?: string;
}) {
  const id = generateId('BC');
  const token = generateToken();
  const items = JSON.stringify(getDefaultBorgItems());

  await sql`
    INSERT INTO borg_checklists (id, booking_id, type, status, items, staff_name, token)
    VALUES (${id}, ${data.bookingId}, ${data.type}, 'OPEN', ${items}::jsonb, ${data.staffName || null}, ${token})
  `;

  return { id, token };
}

export async function getAllBorgChecklists() {
  const result = await sql`
    SELECT bc.*, b.guest_name, b.reference as booking_ref, b.caravan_id, b.check_in, b.check_out
    FROM borg_checklists bc
    JOIN bookings b ON bc.booking_id = b.id
    ORDER BY bc.created_at DESC
  `;
  return result.rows;
}

export async function getBorgChecklistsByBooking(bookingId: string) {
  const result = await sql`
    SELECT * FROM borg_checklists WHERE booking_id = ${bookingId} ORDER BY created_at ASC
  `;
  return result.rows;
}

export async function getBorgChecklistById(id: string) {
  const result = await sql`
    SELECT bc.*, b.guest_name, b.reference as booking_ref, b.caravan_id, b.check_in, b.check_out, b.borg_amount, b.guest_email
    FROM borg_checklists bc
    JOIN bookings b ON bc.booking_id = b.id
    WHERE bc.id = ${id}
  `;
  return result.rows[0] || null;
}

export async function getBorgChecklistByToken(token: string) {
  const result = await sql`
    SELECT bc.*, b.guest_name, b.reference as booking_ref, b.caravan_id, b.check_in, b.check_out, b.borg_amount, b.guest_email
    FROM borg_checklists bc
    JOIN bookings b ON bc.booking_id = b.id
    WHERE bc.token = ${token}
  `;
  return result.rows[0] || null;
}

export async function updateBorgChecklist(id: string, data: {
  items?: string;
  status?: string;
  generalNotes?: string;
  staffName?: string;
  completedAt?: string;
}) {
  if (data.items) {
    await sql`UPDATE borg_checklists SET items = ${data.items}::jsonb WHERE id = ${id}`;
  }
  if (data.status) {
    await sql`UPDATE borg_checklists SET status = ${data.status} WHERE id = ${id}`;
  }
  if (data.generalNotes !== undefined) {
    await sql`UPDATE borg_checklists SET general_notes = ${data.generalNotes} WHERE id = ${id}`;
  }
  if (data.staffName) {
    await sql`UPDATE borg_checklists SET staff_name = ${data.staffName} WHERE id = ${id}`;
  }
  if (data.completedAt) {
    await sql`UPDATE borg_checklists SET completed_at = ${data.completedAt} WHERE id = ${id}`;
  }
}

export async function customerAgreeBorgChecklist(token: string, agreed: boolean, notes?: string) {
  await sql`
    UPDATE borg_checklists SET 
      customer_agreed = ${agreed},
      customer_agreed_at = NOW(),
      customer_notes = ${notes || null},
      status = CASE WHEN ${agreed} THEN 'KLANT_AKKOORD' ELSE 'KLANT_BEZWAAR' END
    WHERE token = ${token}
  `;
}

// ===== CUSTOMER QUERIES =====

export async function createCustomer(data: { email: string; passwordHash: string; name: string; phone?: string }) {
  const id = generateId('CU');
  await sql`
    INSERT INTO customers (id, email, password_hash, name, phone)
    VALUES (${id}, ${data.email}, ${data.passwordHash}, ${data.name}, ${data.phone || null})
  `;
  return { id };
}

export async function getCustomerByEmail(email: string) {
  const result = await sql`SELECT * FROM customers WHERE email = ${email}`;
  return result.rows[0] || null;
}

export async function getCustomerById(id: string) {
  const result = await sql`SELECT * FROM customers WHERE id = ${id}`;
  return result.rows[0] || null;
}

export async function updateCustomerLastLogin(id: string) {
  await sql`UPDATE customers SET last_login = NOW() WHERE id = ${id}`;
}

export async function updateCustomerProfile(id: string, data: { name?: string; phone?: string }) {
  if (data.name && data.phone) {
    await sql`UPDATE customers SET name = ${data.name}, phone = ${data.phone} WHERE id = ${id}`;
  } else if (data.name) {
    await sql`UPDATE customers SET name = ${data.name} WHERE id = ${id}`;
  } else if (data.phone) {
    await sql`UPDATE customers SET phone = ${data.phone} WHERE id = ${id}`;
  }
}

export async function getAllCustomers() {
  const result = await sql`SELECT id, email, name, phone, created_at, last_login FROM customers ORDER BY created_at DESC`;
  return result.rows;
}

export async function deleteCustomer(id: string) {
  // Delete sessions first (FK constraint), then customer
  await sql`DELETE FROM customer_sessions WHERE customer_id = ${id}`;
  await sql`DELETE FROM customers WHERE id = ${id}`;
}

// ===== CUSTOMER SESSION QUERIES =====

export async function createCustomerSession(customerId: string) {
  const id = generateId('CS');
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  await sql`
    INSERT INTO customer_sessions (id, customer_id, token, expires_at)
    VALUES (${id}, ${customerId}, ${token}, ${expiresAt})
  `;
  return { id, token, expiresAt };
}

export async function getCustomerBySessionToken(token: string) {
  const result = await sql`
    SELECT c.* FROM customers c
    JOIN customer_sessions cs ON cs.customer_id = c.id
    WHERE cs.token = ${token} AND cs.expires_at > NOW()
  `;
  return result.rows[0] || null;
}

export async function deleteCustomerSession(token: string) {
  await sql`DELETE FROM customer_sessions WHERE token = ${token}`;
}

export async function getBookingsByEmail(email: string) {
  const result = await sql`
    SELECT * FROM bookings WHERE guest_email = ${email} ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function getPaymentsByBookingIds(bookingIds: string[]) {
  if (bookingIds.length === 0) return [];
  const result = await sql`
    SELECT * FROM payments WHERE booking_id = ANY(${bookingIds as unknown as string}) ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function getBorgChecklistsByEmail(email: string) {
  const result = await sql`
    SELECT bc.*, b.guest_name, b.reference as booking_ref, b.caravan_id, b.check_in, b.check_out, b.borg_amount
    FROM borg_checklists bc
    JOIN bookings b ON bc.booking_id = b.id
    WHERE b.guest_email = ${email}
    ORDER BY bc.created_at DESC
  `;
  return result.rows;
}
