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
      spot_number TEXT,
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

  // Migration: add spot_number column if it doesn't exist
  try {
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS spot_number TEXT`;
  } catch {
    // Column might already exist or DB doesn't support IF NOT EXISTS — ignore
  }

  // Custom caravans table (admin-added caravans)
  await sql`
    CREATE TABLE IF NOT EXISTS custom_caravans (
      id TEXT PRIMARY KEY,
      reference TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'FAMILIE',
      max_persons INTEGER NOT NULL DEFAULT 4,
      manufacturer TEXT NOT NULL,
      year INTEGER NOT NULL,
      description TEXT NOT NULL,
      photos JSONB DEFAULT '[]',
      amenities JSONB DEFAULT '[]',
      inventory JSONB DEFAULT '[]',
      price_per_day NUMERIC(10,2) NOT NULL,
      price_per_week NUMERIC(10,2) NOT NULL,
      deposit NUMERIC(10,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'BESCHIKBAAR',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Newsletters table
  await sql`
    CREATE TABLE IF NOT EXISTS newsletters (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'algemeen',
      event_date DATE,
      event_location TEXT,
      photos JSONB DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'concept',
      sent_at TIMESTAMP,
      sent_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Delete confirmation tokens table
  await sql`
    CREATE TABLE IF NOT EXISTS delete_confirmations (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Migration: add newsletter_unsubscribed column to customers
  try {
    await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS newsletter_unsubscribed BOOLEAN DEFAULT false`;
  } catch {
    // ignore
  }

  // Migration: add photos column to newsletters
  try {
    await sql`ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'`;
  } catch {
    // ignore
  }

  // Discount codes table
  await sql`
    CREATE TABLE IF NOT EXISTS discount_codes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL DEFAULT 'percentage',
      value NUMERIC(10,2) NOT NULL,
      max_uses INTEGER,
      used_count INTEGER DEFAULT 0,
      min_amount NUMERIC(10,2) DEFAULT 0,
      valid_from TIMESTAMP,
      valid_until TIMESTAMP,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Migration: add discount columns to bookings
  try {
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_code TEXT`;
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0`;
  } catch {
    // ignore
  }

  // Booking tasks table (planning / operations)
  await sql`
    CREATE TABLE IF NOT EXISTS booking_tasks (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      task_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'TODO',
      assigned_to TEXT,
      notes TEXT,
      due_date DATE,
      completed_at TIMESTAMP,
      completed_by TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Chat conversations table
  await sql`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id TEXT PRIMARY KEY,
      visitor_name TEXT,
      visitor_email TEXT,
      visitor_phone TEXT,
      customer_id TEXT,
      summary TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      needs_human BOOLEAN DEFAULT false,
      assigned_to TEXT,
      locale TEXT DEFAULT 'nl',
      created_at TIMESTAMP DEFAULT NOW(),
      last_message_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Migration: add customer_id and summary to chat_conversations
  try {
    await sql`ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS customer_id TEXT`;
    await sql`ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS summary TEXT`;
  } catch {
    // ignore
  }

  // Chat messages table
  await sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      message TEXT NOT NULL,
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
  spotNumber?: string;
}) {
  const id = generateId('B');
  const reference = await generateBookingReference();

  await sql`
    INSERT INTO bookings (id, reference, status, guest_name, guest_email, guest_phone, adults, children, special_requests, caravan_id, camping_id, check_in, check_out, nights, total_price, deposit_amount, remaining_amount, borg_amount, spot_number)
    VALUES (${id}, ${reference}, 'NIEUW', ${data.guestName}, ${data.guestEmail}, ${data.guestPhone}, ${data.adults}, ${data.children}, ${data.specialRequests || null}, ${data.caravanId}, ${data.campingId}, ${data.checkIn}, ${data.checkOut}, ${data.nights}, ${data.totalPrice}, ${data.depositAmount}, ${data.remainingAmount}, ${data.borgAmount}, ${data.spotNumber || null})
  `;

  // Create the deposit payment record
  const depositPaymentId = generateId('P');
  await sql`
    INSERT INTO payments (id, booking_id, type, amount, status, method)
    VALUES (${depositPaymentId}, ${id}, 'AANBETALING', ${data.depositAmount}, 'OPENSTAAND', 'ideal')
  `;

  // Create the remaining payment record
  let remainingPaymentId: string | undefined;
  if (data.remainingAmount > 0) {
    remainingPaymentId = generateId('P');
    await sql`
      INSERT INTO payments (id, booking_id, type, amount, status, method)
      VALUES (${remainingPaymentId}, ${id}, 'RESTBETALING', ${data.remainingAmount}, 'OPENSTAAND', 'ideal')
    `;
  }

  return { id, reference, depositPaymentId, remainingPaymentId };
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

export async function deleteBookingById(id: string) {
  // Delete related records first (FK constraints)
  await sql`DELETE FROM borg_checklists WHERE booking_id = ${id}`;
  await sql`DELETE FROM payments WHERE booking_id = ${id}`;
  await sql`DELETE FROM bookings WHERE id = ${id}`;
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
    VALUES (${id}, ${data.bookingId}, ${data.type}, ${data.amount}, ${data.status || 'OPENSTAAND'}, ${data.method || 'ideal'})
  `;
  return { id };
}

export async function getPaymentById(id: string) {
  const result = await sql`
    SELECT * FROM payments WHERE id = ${id}
  `;
  return result.rows[0] || null;
}

export async function updatePaymentStripeId(id: string, stripeId: string) {
  await sql`
    UPDATE payments SET stripe_id = ${stripeId}, method = 'ideal' WHERE id = ${id}
  `;
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

export async function getContactById(id: string) {
  const result = await sql`
    SELECT * FROM contacts WHERE id = ${id}
  `;
  return result.rows[0] || null;
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

export async function updateCustomerByAdmin(id: string, data: { name?: string; email?: string; phone?: string }) {
  const fields: string[] = [];
  const values: (string | null)[] = [];
  if (data.name !== undefined) { fields.push('name'); values.push(data.name); }
  if (data.email !== undefined) { fields.push('email'); values.push(data.email.toLowerCase().trim()); }
  if (data.phone !== undefined) { fields.push('phone'); values.push(data.phone || null); }
  if (fields.length === 0) return;
  
  // Build dynamic update - using individual conditionals since sql template doesn't support dynamic columns easily
  if (data.name !== undefined && data.email !== undefined && data.phone !== undefined) {
    await sql`UPDATE customers SET name = ${data.name}, email = ${data.email.toLowerCase().trim()}, phone = ${data.phone || null} WHERE id = ${id}`;
  } else if (data.name !== undefined && data.email !== undefined) {
    await sql`UPDATE customers SET name = ${data.name}, email = ${data.email.toLowerCase().trim()} WHERE id = ${id}`;
  } else if (data.name !== undefined && data.phone !== undefined) {
    await sql`UPDATE customers SET name = ${data.name}, phone = ${data.phone || null} WHERE id = ${id}`;
  } else if (data.email !== undefined && data.phone !== undefined) {
    await sql`UPDATE customers SET email = ${data.email.toLowerCase().trim()}, phone = ${data.phone || null} WHERE id = ${id}`;
  } else if (data.name !== undefined) {
    await sql`UPDATE customers SET name = ${data.name} WHERE id = ${id}`;
  } else if (data.email !== undefined) {
    await sql`UPDATE customers SET email = ${data.email.toLowerCase().trim()} WHERE id = ${id}`;
  } else if (data.phone !== undefined) {
    await sql`UPDATE customers SET phone = ${data.phone || null} WHERE id = ${id}`;
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

// ===== CUSTOM CARAVAN QUERIES =====

export async function getAllCustomCaravans() {
  const result = await sql`SELECT * FROM custom_caravans ORDER BY created_at DESC`;
  return result.rows;
}

export async function getCustomCaravanById(id: string) {
  const result = await sql`SELECT * FROM custom_caravans WHERE id = ${id}`;
  return result.rows[0] || null;
}

export async function createCustomCaravan(data: {
  name: string;
  type: string;
  maxPersons: number;
  manufacturer: string;
  year: number;
  description: string;
  photos: string[];
  amenities: string[];
  inventory: string[];
  pricePerDay: number;
  pricePerWeek: number;
  deposit: number;
}) {
  const id = generateId('CC');
  // Generate reference like CV-007, CV-008, etc.
  const countResult = await sql`SELECT COUNT(*) as count FROM custom_caravans`;
  const refNum = parseInt(countResult.rows[0].count) + 7; // Start after existing 6 static caravans
  const reference = `CV-${refNum.toString().padStart(3, '0')}`;

  await sql`
    INSERT INTO custom_caravans (id, reference, name, type, max_persons, manufacturer, year, description, photos, amenities, inventory, price_per_day, price_per_week, deposit)
    VALUES (${id}, ${reference}, ${data.name}, ${data.type}, ${data.maxPersons}, ${data.manufacturer}, ${data.year}, ${data.description}, ${JSON.stringify(data.photos)}, ${JSON.stringify(data.amenities)}, ${JSON.stringify(data.inventory)}, ${data.pricePerDay}, ${data.pricePerWeek}, ${data.deposit})
  `;
  return { id, reference };
}

export async function updateCustomCaravan(id: string, data: {
  name?: string;
  type?: string;
  maxPersons?: number;
  manufacturer?: string;
  year?: number;
  description?: string;
  photos?: string[];
  amenities?: string[];
  inventory?: string[];
  pricePerDay?: number;
  pricePerWeek?: number;
  deposit?: number;
  status?: string;
}) {
  // Build update dynamically
  const existing = await getCustomCaravanById(id);
  if (!existing) return null;

  const name = data.name ?? existing.name;
  const type = data.type ?? existing.type;
  const maxPersons = data.maxPersons ?? existing.max_persons;
  const manufacturer = data.manufacturer ?? existing.manufacturer;
  const year = data.year ?? existing.year;
  const description = data.description ?? existing.description;
  const photos = data.photos ? JSON.stringify(data.photos) : existing.photos;
  const amenities = data.amenities ? JSON.stringify(data.amenities) : existing.amenities;
  const inventory = data.inventory ? JSON.stringify(data.inventory) : existing.inventory;
  const pricePerDay = data.pricePerDay ?? existing.price_per_day;
  const pricePerWeek = data.pricePerWeek ?? existing.price_per_week;
  const deposit = data.deposit ?? existing.deposit;
  const status = data.status ?? existing.status;

  await sql`
    UPDATE custom_caravans SET
      name = ${name},
      type = ${type},
      max_persons = ${maxPersons},
      manufacturer = ${manufacturer},
      year = ${year},
      description = ${description},
      photos = ${photos},
      amenities = ${amenities},
      inventory = ${inventory},
      price_per_day = ${pricePerDay},
      price_per_week = ${pricePerWeek},
      deposit = ${deposit},
      status = ${status},
      updated_at = NOW()
    WHERE id = ${id}
  `;
  return { success: true };
}

export async function deleteCustomCaravan(id: string) {
  await sql`DELETE FROM custom_caravans WHERE id = ${id}`;
}

// ===== NEWSLETTER QUERIES =====

export async function createNewsletter(data: {
  title: string;
  content: string;
  category: string;
  eventDate?: string;
  eventLocation?: string;
  photos?: string[];
}) {
  const id = generateId('NL');
  const photosJson = data.photos ? JSON.stringify(data.photos) : '[]';
  await sql`
    INSERT INTO newsletters (id, title, content, category, event_date, event_location, photos)
    VALUES (${id}, ${data.title}, ${data.content}, ${data.category}, ${data.eventDate || null}, ${data.eventLocation || null}, ${photosJson})
  `;
  return { id };
}

export async function getAllNewsletters() {
  const result = await sql`SELECT * FROM newsletters ORDER BY created_at DESC`;
  return result.rows;
}

export async function getNewsletterById(id: string) {
  const result = await sql`SELECT * FROM newsletters WHERE id = ${id}`;
  return result.rows[0] || null;
}

export async function updateNewsletter(id: string, data: {
  title?: string;
  content?: string;
  category?: string;
  eventDate?: string | null;
  eventLocation?: string | null;
  photos?: string[];
}) {
  const existing = await getNewsletterById(id);
  if (!existing) return null;

  const title = data.title ?? existing.title;
  const content = data.content ?? existing.content;
  const category = data.category ?? existing.category;
  const eventDate = data.eventDate !== undefined ? data.eventDate : existing.event_date;
  const eventLocation = data.eventLocation !== undefined ? data.eventLocation : existing.event_location;
  const photos = data.photos !== undefined ? JSON.stringify(data.photos) : (existing.photos || '[]');

  await sql`
    UPDATE newsletters SET
      title = ${title},
      content = ${content},
      category = ${category},
      event_date = ${eventDate},
      event_location = ${eventLocation},
      photos = ${typeof photos === 'string' ? photos : JSON.stringify(photos)},
      updated_at = NOW()
    WHERE id = ${id}
  `;
  return { success: true };
}

export async function markNewsletterSent(id: string, sentCount: number) {
  await sql`
    UPDATE newsletters SET
      status = 'verzonden',
      sent_at = NOW(),
      sent_count = ${sentCount},
      updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function deleteNewsletter(id: string) {
  await sql`DELETE FROM newsletters WHERE id = ${id}`;
}

export async function getAllCustomerEmails() {
  // Get unique emails from both customers table and bookings
  const result = await sql`
    SELECT DISTINCT email FROM (
      SELECT email FROM customers
      UNION
      SELECT guest_email AS email FROM bookings
    ) AS all_emails
    WHERE email IS NOT NULL AND email != ''
    ORDER BY email
  `;
  return result.rows.map(r => r.email as string);
}

// ===== NEWSLETTER SUBSCRIPTION =====

export async function getSubscribedCustomerEmails() {
  // Get unique emails excluding unsubscribed customers
  const result = await sql`
    SELECT DISTINCT email FROM (
      SELECT email FROM customers WHERE newsletter_unsubscribed = false OR newsletter_unsubscribed IS NULL
      UNION
      SELECT guest_email AS email FROM bookings
      WHERE guest_email NOT IN (SELECT email FROM customers WHERE newsletter_unsubscribed = true)
    ) AS all_emails
    WHERE email IS NOT NULL AND email != ''
    ORDER BY email
  `;
  return result.rows.map(r => r.email as string);
}

export async function setNewsletterSubscription(email: string, unsubscribed: boolean) {
  try {
    await sql`
      UPDATE customers SET newsletter_unsubscribed = ${unsubscribed} WHERE LOWER(email) = LOWER(${email})
    `;
  } catch (error) {
    // Column might not exist yet — try to add it and retry
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('newsletter_unsubscribed') || msg.includes('column')) {
      try {
        await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS newsletter_unsubscribed BOOLEAN DEFAULT false`;
        await sql`UPDATE customers SET newsletter_unsubscribed = ${unsubscribed} WHERE LOWER(email) = LOWER(${email})`;
      } catch {
        throw error;
      }
    } else {
      throw error;
    }
  }
}

export async function getNewsletterSubscriptionStatus(email: string) {
  try {
    const result = await sql`
      SELECT newsletter_unsubscribed FROM customers WHERE LOWER(email) = LOWER(${email})
    `;
    return result.rows[0]?.newsletter_unsubscribed === true;
  } catch {
    // Column may not exist yet — return safe default
    return false;
  }
}

// ===== DATA PURGE =====

export async function purgeAllTestData() {
  // Delete in correct order for FK constraints, each wrapped to be resilient
  const errors: string[] = [];
  const deleteTables = async () => {
    try { await sql`DELETE FROM delete_confirmations`; } catch (e) { errors.push(`delete_confirmations: ${e instanceof Error ? e.message : String(e)}`); }
    try { await sql`DELETE FROM customer_sessions`; } catch (e) { errors.push(`customer_sessions: ${e instanceof Error ? e.message : String(e)}`); }
    try { await sql`DELETE FROM borg_checklists`; } catch (e) { errors.push(`borg_checklists: ${e instanceof Error ? e.message : String(e)}`); }
    try { await sql`DELETE FROM payments`; } catch (e) { errors.push(`payments: ${e instanceof Error ? e.message : String(e)}`); }
    try { await sql`DELETE FROM bookings`; } catch (e) { errors.push(`bookings: ${e instanceof Error ? e.message : String(e)}`); }
    try { await sql`DELETE FROM contacts`; } catch (e) { errors.push(`contacts: ${e instanceof Error ? e.message : String(e)}`); }
    try { await sql`DELETE FROM newsletters`; } catch (e) { errors.push(`newsletters: ${e instanceof Error ? e.message : String(e)}`); }
    try { await sql`DELETE FROM customers`; } catch (e) { errors.push(`customers: ${e instanceof Error ? e.message : String(e)}`); }
  };
  await deleteTables();
  return { success: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
}

// ===== DELETE CONFIRMATION =====

export async function createDeleteConfirmation(customerId: string) {
  const id = generateId('DC');
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
  await sql`
    INSERT INTO delete_confirmations (id, customer_id, token, expires_at)
    VALUES (${id}, ${customerId}, ${token}, ${expiresAt})
  `;
  return { id, token };
}

export async function getDeleteConfirmation(token: string) {
  const result = await sql`
    SELECT dc.*, c.email, c.name FROM delete_confirmations dc
    JOIN customers c ON c.id = dc.customer_id
    WHERE dc.token = ${token} AND dc.expires_at > NOW()
  `;
  return result.rows[0] || null;
}

export async function executeDeleteConfirmation(token: string) {
  const confirmation = await getDeleteConfirmation(token);
  if (!confirmation) return null;

  // Delete sessions, then customer
  await sql`DELETE FROM customer_sessions WHERE customer_id = ${confirmation.customer_id}`;
  await sql`DELETE FROM customers WHERE id = ${confirmation.customer_id}`;
  await sql`DELETE FROM delete_confirmations WHERE token = ${token}`;
  return { success: true, email: confirmation.email, name: confirmation.name };
}

// ===== NEWSLETTER CREATE WITH PHOTOS =====

export async function createNewsletterWithPhotos(data: {
  title: string;
  content: string;
  category: string;
  eventDate?: string;
  eventLocation?: string;
  photos?: string[];
}) {
  const id = generateId('NL');
  const photos = JSON.stringify(data.photos || []);
  await sql`
    INSERT INTO newsletters (id, title, content, category, event_date, event_location, photos)
    VALUES (${id}, ${data.title}, ${data.content}, ${data.category}, ${data.eventDate || null}, ${data.eventLocation || null}, ${photos})
  `;
  return { id };
}

// ===== DISCOUNT CODE QUERIES =====

export async function createDiscountCode(data: {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxUses?: number;
  minAmount?: number;
  validFrom?: string;
  validUntil?: string;
}) {
  const id = generateId('DC');
  await sql`
    INSERT INTO discount_codes (id, code, type, value, max_uses, min_amount, valid_from, valid_until)
    VALUES (${id}, ${data.code.toUpperCase()}, ${data.type}, ${data.value}, ${data.maxUses || null}, ${data.minAmount || 0}, ${data.validFrom || null}, ${data.validUntil || null})
  `;
  return { id };
}

export async function getAllDiscountCodes() {
  const result = await sql`SELECT * FROM discount_codes ORDER BY created_at DESC`;
  return result.rows;
}

export async function getDiscountCodeByCode(code: string) {
  const result = await sql`SELECT * FROM discount_codes WHERE UPPER(code) = UPPER(${code})`;
  return result.rows[0] || null;
}

export async function validateDiscountCode(code: string, totalAmount: number) {
  const dc = await getDiscountCodeByCode(code);
  if (!dc) return { valid: false, error: 'Code niet gevonden' };
  if (!dc.active) return { valid: false, error: 'Code is niet meer actief' };
  if (dc.max_uses && dc.used_count >= dc.max_uses) return { valid: false, error: 'Code is al maximaal gebruikt' };
  if (dc.min_amount && totalAmount < parseFloat(dc.min_amount)) return { valid: false, error: `Minimaal bestelbedrag is €${dc.min_amount}` };
  if (dc.valid_from && new Date(dc.valid_from) > new Date()) return { valid: false, error: 'Code is nog niet geldig' };
  if (dc.valid_until && new Date(dc.valid_until) < new Date()) return { valid: false, error: 'Code is verlopen' };

  let discountAmount = 0;
  if (dc.type === 'percentage') {
    discountAmount = Math.round(totalAmount * (parseFloat(dc.value) / 100));
  } else {
    discountAmount = Math.min(parseFloat(dc.value), totalAmount);
  }

  return { valid: true, discountCode: dc, discountAmount, type: dc.type, value: parseFloat(dc.value) };
}

export async function incrementDiscountCodeUsage(code: string) {
  await sql`UPDATE discount_codes SET used_count = used_count + 1 WHERE UPPER(code) = UPPER(${code})`;
}

export async function updateDiscountCode(id: string, data: { active?: boolean; maxUses?: number; validUntil?: string }) {
  if (data.active !== undefined) {
    await sql`UPDATE discount_codes SET active = ${data.active} WHERE id = ${id}`;
  }
  if (data.maxUses !== undefined) {
    await sql`UPDATE discount_codes SET max_uses = ${data.maxUses} WHERE id = ${id}`;
  }
  if (data.validUntil !== undefined) {
    await sql`UPDATE discount_codes SET valid_until = ${data.validUntil} WHERE id = ${id}`;
  }
}

export async function deleteDiscountCode(id: string) {
  await sql`DELETE FROM discount_codes WHERE id = ${id}`;
}

export async function applyBookingDiscount(bookingId: string, discountCode: string, discountAmount: number) {
  const booking = await getBookingById(bookingId);
  if (!booking) return null;

  const newTotalPrice = Math.max(0, parseFloat(booking.total_price) - discountAmount);
  const newDeposit = Math.round(newTotalPrice * 0.3);
  const newRemaining = newTotalPrice - newDeposit;

  await sql`
    UPDATE bookings SET 
      discount_code = ${discountCode},
      discount_amount = ${discountAmount},
      total_price = ${newTotalPrice},
      deposit_amount = ${newDeposit},
      remaining_amount = ${newRemaining}
    WHERE id = ${bookingId}
  `;

  // Update payment amounts
  await sql`UPDATE payments SET amount = ${newDeposit} WHERE booking_id = ${bookingId} AND type = 'AANBETALING' AND status = 'OPENSTAAND'`;
  await sql`UPDATE payments SET amount = ${newRemaining} WHERE booking_id = ${bookingId} AND type = 'RESTBETALING' AND status = 'OPENSTAAND'`;

  return { newTotalPrice, newDeposit, newRemaining };
}

// ===== BOOKING TASKS (PLANNING) =====

const TASK_TYPES = ['PREP', 'TRANSPORT', 'SETUP', 'CHECKIN', 'CHECKOUT', 'PICKUP', 'CLEANING', 'INSPECTION'] as const;

export async function getTasksForBooking(bookingId: string) {
  const result = await sql`
    SELECT * FROM booking_tasks WHERE booking_id = ${bookingId} ORDER BY created_at ASC
  `;
  return result.rows;
}

export async function getAllTasks() {
  const result = await sql`
    SELECT t.*, b.guest_name, b.reference as booking_ref, b.caravan_id, b.camping_id, b.check_in, b.check_out, b.status as booking_status
    FROM booking_tasks t
    JOIN bookings b ON t.booking_id = b.id
    ORDER BY t.due_date ASC NULLS LAST, t.created_at ASC
  `;
  return result.rows;
}

export async function ensureTasksForBooking(bookingId: string, checkIn: string, checkOut: string) {
  const existing = await sql`SELECT task_type FROM booking_tasks WHERE booking_id = ${bookingId}`;
  const existingTypes = new Set(existing.rows.map((r) => r.task_type as string));

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const prepDate = new Date(checkInDate);
  prepDate.setDate(prepDate.getDate() - 3);
  const transportDate = new Date(checkInDate);
  transportDate.setDate(transportDate.getDate() - 1);

  const dueDates: Record<string, Date> = {
    PREP: prepDate,
    TRANSPORT: transportDate,
    SETUP: transportDate,
    CHECKIN: checkInDate,
    CHECKOUT: checkOutDate,
    PICKUP: new Date(checkOutDate.getTime() + 86400000),
    CLEANING: new Date(checkOutDate.getTime() + 2 * 86400000),
    INSPECTION: new Date(checkOutDate.getTime() + 2 * 86400000),
  };

  for (const taskType of TASK_TYPES) {
    if (!existingTypes.has(taskType)) {
      const id = generateId('task');
      const dueDate = dueDates[taskType].toISOString().slice(0, 10);
      await sql`
        INSERT INTO booking_tasks (id, booking_id, task_type, status, due_date)
        VALUES (${id}, ${bookingId}, ${taskType}, 'TODO', ${dueDate})
      `;
    }
  }
}

export async function updateTaskStatus(taskId: string, status: string, completedBy?: string) {
  if (status === 'DONE') {
    await sql`
      UPDATE booking_tasks SET status = ${status}, completed_at = NOW(), completed_by = ${completedBy || null} WHERE id = ${taskId}
    `;
  } else {
    await sql`
      UPDATE booking_tasks SET status = ${status}, completed_at = NULL, completed_by = NULL WHERE id = ${taskId}
    `;
  }
}

export async function updateTaskAssignment(taskId: string, assignedTo: string) {
  await sql`
    UPDATE booking_tasks SET assigned_to = ${assignedTo} WHERE id = ${taskId}
  `;
}

export async function updateTaskNotes(taskId: string, notes: string) {
  await sql`
    UPDATE booking_tasks SET notes = ${notes} WHERE id = ${taskId}
  `;
}

export async function ensureAllBookingTasks() {
  const bookings = await sql`
    SELECT id, check_in, check_out FROM bookings WHERE status != 'GEANNULEERD'
  `;
  for (const booking of bookings.rows) {
    await ensureTasksForBooking(booking.id, booking.check_in, booking.check_out);
  }
}

// ===== CHAT CONVERSATIONS =====

export async function createChatConversation(data: {
  visitorName?: string;
  visitorEmail?: string;
  visitorPhone?: string;
  locale?: string;
}) {
  const id = generateId('chat');
  await sql`
    INSERT INTO chat_conversations (id, visitor_name, visitor_email, visitor_phone, locale)
    VALUES (${id}, ${data.visitorName || null}, ${data.visitorEmail || null}, ${data.visitorPhone || null}, ${data.locale || 'nl'})
  `;
  return { id };
}

export async function addChatMessage(data: {
  conversationId: string;
  role: string;
  message: string;
}) {
  const id = generateId('msg');
  await sql`
    INSERT INTO chat_messages (id, conversation_id, role, message)
    VALUES (${id}, ${data.conversationId}, ${data.role}, ${data.message})
  `;
  await sql`
    UPDATE chat_conversations SET last_message_at = NOW() WHERE id = ${data.conversationId}
  `;
  return { id };
}

export async function getChatConversation(id: string) {
  const conv = await sql`SELECT * FROM chat_conversations WHERE id = ${id}`;
  if (!conv.rows[0]) return null;
  const msgs = await sql`SELECT * FROM chat_messages WHERE conversation_id = ${id} ORDER BY created_at ASC`;
  return { ...conv.rows[0], messages: msgs.rows };
}

export async function getAllChatConversations() {
  const result = await sql`
    SELECT c.*, 
      (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id) as message_count,
      (SELECT message FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT role FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_role
    FROM chat_conversations c
    ORDER BY c.last_message_at DESC
  `;
  return result.rows;
}

export async function markConversationNeedsHuman(id: string) {
  await sql`
    UPDATE chat_conversations SET needs_human = true WHERE id = ${id}
  `;
}

export async function updateConversationVisitor(id: string, data: { name?: string; email?: string; phone?: string }) {
  if (data.name) await sql`UPDATE chat_conversations SET visitor_name = ${data.name} WHERE id = ${id}`;
  if (data.email) await sql`UPDATE chat_conversations SET visitor_email = ${data.email} WHERE id = ${id}`;
  if (data.phone) await sql`UPDATE chat_conversations SET visitor_phone = ${data.phone} WHERE id = ${id}`;
}

export async function updateConversationStatus(id: string, status: string, assignedTo?: string) {
  if (assignedTo !== undefined) {
    await sql`UPDATE chat_conversations SET status = ${status}, assigned_to = ${assignedTo} WHERE id = ${id}`;
  } else {
    await sql`UPDATE chat_conversations SET status = ${status} WHERE id = ${id}`;
  }
}

export async function deleteChatConversation(id: string) {
  // Messages are deleted via CASCADE
  await sql`DELETE FROM chat_conversations WHERE id = ${id}`;
}

export async function linkChatToCustomer(conversationId: string, customerId: string) {
  await sql`UPDATE chat_conversations SET customer_id = ${customerId} WHERE id = ${conversationId}`;
}

export async function getChatConversationsByCustomerId(customerId: string) {
  const result = await sql`
    SELECT c.*, 
      (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id) as message_count,
      (SELECT message FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
    FROM chat_conversations c
    WHERE c.customer_id = ${customerId}
    ORDER BY c.created_at DESC
  `;
  return result.rows;
}

export async function getChatSummaryForCustomer(customerId: string) {
  // Get all user messages from conversations linked to this customer
  const result = await sql`
    SELECT m.message, m.created_at, c.id as conversation_id
    FROM chat_messages m
    JOIN chat_conversations c ON m.conversation_id = c.id
    WHERE c.customer_id = ${customerId} AND m.role = 'user'
    ORDER BY m.created_at ASC
  `;
  return result.rows;
}

export async function updateChatSummary(conversationId: string, summary: string) {
  await sql`UPDATE chat_conversations SET summary = ${summary} WHERE id = ${conversationId}`;
}

export async function getCustomerByEmailSimple(email: string) {
  const result = await sql`SELECT id, email, name, phone FROM customers WHERE LOWER(email) = LOWER(${email})`;
  return result.rows[0] || null;
}
