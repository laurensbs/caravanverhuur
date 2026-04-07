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
  bulkDeleteChatConversations,
  deleteClosedChatConversations,
  linkChatToCustomer,
  getChatMessagesByConversationId,
  searchCustomersSimple,
} from '@/lib/db';
import { getSessionFromHeaders } from '@/lib/admin-auth';

// GET: List all conversations, get one by ?id=..., get messages, or search customers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    // Search customers for linking
    if (action === 'searchCustomers') {
      const q = searchParams.get('q') || '';
      if (q.length < 2) return NextResponse.json({ customers: [] });
      const customers = await searchCustomersSimple(q);
      return NextResponse.json({ customers });
    }

    // Get messages for a conversation (used by customer detail panel)
    if (action === 'messages' && id) {
      const messages = await getChatMessagesByConversationId(id);
      return NextResponse.json({ messages });
    }

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

// PATCH: Update conversation status, summary, or link to customer
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, status, assignedTo, summary, customerId } = body;

    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
    }

    if (customerId !== undefined) {
      await linkChatToCustomer(conversationId, customerId);
      logActivity({ actor: getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'chat_linked_customer', entityType: 'chat', entityId: conversationId, entityLabel: `Chat #${conversationId}` }).catch(() => {});
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

// DELETE: Delete a chat conversation, bulk delete, or delete all closed
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    // Bulk delete by IDs (POST body)
    if (action === 'bulk') {
      const body = await request.json();
      const ids: string[] = body.ids || [];
      if (ids.length === 0) return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
      const deleted = await bulkDeleteChatConversations(ids);
      logActivity({ actor: getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'chat_bulk_deleted', entityType: 'chat', entityId: 'bulk', entityLabel: `${deleted} chats`, details: `Deleted ${deleted} conversations` }).catch(() => {});
      return NextResponse.json({ success: true, deleted });
    }

    // Delete all closed conversations
    if (action === 'closed') {
      const deleted = await deleteClosedChatConversations();
      logActivity({ actor: getSessionFromHeaders(request).user, role: getSessionFromHeaders(request).role, action: 'chat_closed_deleted', entityType: 'chat', entityId: 'closed', entityLabel: `${deleted} closed chats`, details: `Deleted ${deleted} closed conversations` }).catch(() => {});
      return NextResponse.json({ success: true, deleted });
    }

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
