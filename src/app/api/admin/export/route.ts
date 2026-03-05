import { NextResponse } from 'next/server';
import {
  getAllBookings,
  getAllPayments,
  getAllContacts,
  getAllCustomers,
  getAllBorgChecklists,
  getAllNewsletters,
  getCaravanSettings,
  getAllCustomCaravans,
} from '@/lib/db';

export async function GET() {
  try {
    const [
      bookings,
      payments,
      contacts,
      customers,
      checklists,
      newsletters,
      caravanSettings,
      customCaravans,
    ] = await Promise.all([
      getAllBookings(),
      getAllPayments(),
      getAllContacts(),
      getAllCustomers(),
      getAllBorgChecklists(),
      getAllNewsletters(),
      getCaravanSettings(),
      getAllCustomCaravans(),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: {
        bookings,
        payments,
        contacts,
        customers,
        borgChecklists: checklists,
        newsletters,
        caravanSettings,
        customCaravans,
      },
      counts: {
        bookings: bookings.length,
        payments: payments.length,
        contacts: contacts.length,
        customers: customers.length,
        borgChecklists: checklists.length,
        newsletters: newsletters.length,
        caravanSettings: caravanSettings.length,
        customCaravans: customCaravans.length,
      },
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="caravanverhuur-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
