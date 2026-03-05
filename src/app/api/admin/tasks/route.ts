import { NextRequest, NextResponse } from 'next/server';
import { getAllTasks, ensureAllBookingTasks, updateTaskStatus, updateTaskAssignment, updateTaskNotes, setupDatabase } from '@/lib/db';

export async function GET() {
  try {
    // Ensure tasks exist for all bookings
    try {
      await ensureAllBookingTasks();
    } catch {
      // Try setup first
      await setupDatabase();
      await ensureAllBookingTasks();
    }

    const tasks = await getAllTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('GET /api/admin/tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, status, completedBy, assignedTo, notes } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    if (status !== undefined) {
      await updateTaskStatus(taskId, status, completedBy);
    }
    if (assignedTo !== undefined) {
      await updateTaskAssignment(taskId, assignedTo);
    }
    if (notes !== undefined) {
      await updateTaskNotes(taskId, notes);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/admin/tasks error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
