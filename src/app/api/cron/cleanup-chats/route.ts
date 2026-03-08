import { NextRequest, NextResponse } from 'next/server';
import { deleteOldChatConversations } from '@/lib/db';
import { cookies } from 'next/headers';

// Automatically clean up old chat conversations
// Called daily via Vercel Cron or manually from admin panel
// Deletes conversations older than 30 days

const DAYS_TO_KEEP = 30;

export async function POST(request: NextRequest) {
  // Allow access via cron secret OR admin session cookie
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('admin_session')?.value;

  const isCron = !cronSecret || authHeader === `Bearer ${cronSecret}`;
  const isAdmin = !!adminSession; // Admin session cookie present

  if (!isCron && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const deleted = await deleteOldChatConversations(DAYS_TO_KEEP);
    return NextResponse.json({
      success: true,
      deleted,
      message: `Deleted ${deleted} chat conversation(s) older than ${DAYS_TO_KEEP} days`,
    });
  } catch (error) {
    console.error('Cleanup chats error:', error);
    return NextResponse.json({ error: 'Failed to cleanup chats' }, { status: 500 });
  }
}
