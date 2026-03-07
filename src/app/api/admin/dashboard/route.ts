import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats, getRecentBookings, getRecentContacts, getUpcomingStays, setupDatabase, purgeAllTestData } from '@/lib/db';

export async function GET() {
  try {
    const [stats, recentBookings, recentContacts, upcomingStays] = await Promise.all([
      getDashboardStats(),
      getRecentBookings(5),
      getRecentContacts(3),
      getUpcomingStays(),
    ]);

    return NextResponse.json({
      stats,
      recentBookings,
      recentContacts,
      upcomingStays,
    });
  } catch (error) {
    console.error('GET /api/admin/dashboard error:', error);
    // Auto-setup tables and retry
    try {
      await setupDatabase();
      const [stats, recentBookings, recentContacts, upcomingStays] = await Promise.all([
        getDashboardStats(),
        getRecentBookings(5),
        getRecentContacts(3),
        getUpcomingStays(),
      ]);
      return NextResponse.json({ stats, recentBookings, recentContacts, upcomingStays });
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await purgeAllTestData();
    return NextResponse.json({ message: 'Alle testdata is verwijderd', ...result });
  } catch (error) {
    console.error('Purge error:', error);
    return NextResponse.json({ error: 'Fout bij verwijderen testdata', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
