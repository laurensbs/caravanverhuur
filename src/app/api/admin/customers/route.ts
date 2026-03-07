import { NextRequest, NextResponse } from 'next/server';
import { getAllCustomers, createCustomer, getCustomerByEmail, updateCustomerByAdmin, deleteCustomer, getChatConversationsByCustomerId } from '@/lib/db';
import { hashPassword } from '@/lib/password';

// GET - List all customers or get chats for a specific customer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const action = searchParams.get('action');

    if (action === 'chats' && customerId) {
      const chats = await getChatConversationsByCustomerId(customerId);
      return NextResponse.json({ chats });
    }

    const customers = await getAllCustomers();
    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Fout bij ophalen klanten' }, { status: 500 });
  }
}

// POST - Create new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, phone, password } = body;

    if (!email || !name) {
      return NextResponse.json({ error: 'E-mail en naam zijn verplicht' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await getCustomerByEmail(email.toLowerCase().trim());
    if (existing) {
      return NextResponse.json({ error: 'Er bestaat al een klant met dit e-mailadres' }, { status: 409 });
    }

    // Use provided password or generate a random one
    const customerPassword = password || crypto.randomUUID().slice(0, 12);
    const passwordHash = await hashPassword(customerPassword);

    const result = await createCustomer({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name.trim(),
      phone: phone?.trim(),
    });

    return NextResponse.json({ 
      success: true, 
      customerId: result.id,
      generatedPassword: !password ? customerPassword : undefined,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Fout bij aanmaken klant' }, { status: 500 });
  }
}

// PATCH - Update customer details
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, email, phone } = body;

    if (!id) {
      return NextResponse.json({ error: 'Klant-ID is verplicht' }, { status: 400 });
    }

    // If email is being changed, check uniqueness
    if (email) {
      const existing = await getCustomerByEmail(email.toLowerCase().trim());
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: 'Dit e-mailadres is al in gebruik door een andere klant' }, { status: 409 });
      }
    }

    await updateCustomerByAdmin(id, { name, email, phone });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Fout bij bijwerken klant' }, { status: 500 });
  }
}

// DELETE - Delete customer (requires admin password)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, adminPassword } = body;

    if (!id) {
      return NextResponse.json({ error: 'Klant-ID is verplicht' }, { status: 400 });
    }

    await deleteCustomer(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Fout bij verwijderen klant' }, { status: 500 });
  }
}
