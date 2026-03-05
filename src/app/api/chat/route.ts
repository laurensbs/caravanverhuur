import { NextRequest, NextResponse } from 'next/server';
import {
  createChatConversation,
  addChatMessage,
  getChatConversation,
  markConversationNeedsHuman,
  updateConversationVisitor,
  setupDatabase,
} from '@/lib/db';

// POST: Create conversation or send message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      // Create new conversation
      try {
        const result = await createChatConversation({
          visitorName: body.visitorName,
          locale: body.locale || 'nl',
        });
        return NextResponse.json(result, { status: 201 });
      } catch {
        await setupDatabase();
        const result = await createChatConversation({
          visitorName: body.visitorName,
          locale: body.locale || 'nl',
        });
        return NextResponse.json(result, { status: 201 });
      }
    }

    if (action === 'message') {
      const { conversationId, role, message } = body;
      if (!conversationId || !message) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
      }
      const result = await addChatMessage({ conversationId, role: role || 'user', message });
      return NextResponse.json(result);
    }

    if (action === 'needsHuman') {
      const { conversationId } = body;
      if (!conversationId) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
      await markConversationNeedsHuman(conversationId);
      return NextResponse.json({ success: true });
    }

    if (action === 'updateVisitor') {
      const { conversationId, name, email, phone } = body;
      if (!conversationId) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
      await updateConversationVisitor(conversationId, { name, email, phone });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/chat error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// GET: Get conversation messages (for polling)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');
    if (!conversationId) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    const conversation = await getChatConversation(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(conversation);
  } catch (error) {
    console.error('GET /api/chat error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
