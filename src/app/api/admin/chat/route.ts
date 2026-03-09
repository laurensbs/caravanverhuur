import { NextRequest, NextResponse } from 'next/server';
import {
  getAllChatConversations,
  getChatConversation,
  addChatMessage,
  updateConversationStatus,
  deleteChatConversation,
  updateChatSummary,
  setupDatabase,
  logActivity,
} from '@/lib/db';
import { getSessionFromHeaders } from '@/lib/admin-auth';

// GET: List all conversations or get one by ?id=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const conversation = await getChatConversation(id);
      if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(conversation);
    }

    try {
      const conversations = await getAllChatConversations();
      return NextResponse.json({ conversations });
    } catch {
      await setupDatabase();
      const conversations = await getAllChatConversations();
      return NextResponse.json({ conversations });
    }
  } catch (error) {
    console.error('GET /api/admin/chat error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST: Admin sends a message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, message, staffName } = body;

    if (!conversationId || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const result = await addChatMessage({
      conversationId,
      role: 'staff',
      message,
    });

    // Mark as assigned
    await updateConversationStatus(conversationId, 'ACTIVE', staffName || 'Staff');

    logActivity({ actor: staffName || getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'chat_reply', entityType: 'chat', entityId: conversationId, entityLabel: `Chat #${conversationId}` }).catch(() => {});

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/admin/chat error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// PATCH: Update conversation status or summary
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, status, assignedTo, summary } = body;

    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
    }

    if (summary !== undefined) {
      await updateChatSummary(conversationId, summary);
    }

    if (status) {
      await updateConversationStatus(conversationId, status, assignedTo);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/admin/chat error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// DELETE: Delete a chat conversation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    await deleteChatConversation(id);
    logActivity({ actor: getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'chat_deleted', entityType: 'chat', entityId: id, entityLabel: `Chat #${id}` }).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/chat error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
