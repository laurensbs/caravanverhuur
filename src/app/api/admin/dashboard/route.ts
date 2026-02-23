import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats, getRecentBookings, getRecentContacts, getUpcomingStays } from '@/lib/db';

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
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
