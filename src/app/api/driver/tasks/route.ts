import { NextRequest, NextResponse } from 'next/server';
import { verifyDriverRequest, unauthorizedResponse } from '@/lib/driver-auth';
import { getTasksForDriver, getDriverById, updateTaskStatus, updateTaskNotes } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await verifyDriverRequest(request);
  if (!session) return unauthorizedResponse();

  const driver = await getDriverById(session.id);
  if (!driver?.active) return unauthorizedResponse();

  try {
    const tasks = await getTasksForDriver(driver.name);
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('GET /api/driver/tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await verifyDriverRequest(request);
  if (!session) return unauthorizedResponse();

  const driver = await getDriverById(session.id);
  if (!driver?.active) return unauthorizedResponse();

  try {
    const { taskId, status, notes } = await request.json();
    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    // Verify the task is assigned to this driver
    const tasks = await getTasksForDriver(driver.name);
    const task = tasks.find((t) => (t as { id: string }).id === taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found or not assigned to you' }, { status: 403 });
    }

    if (status !== undefined) {
      const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      await updateTaskStatus(taskId, status, status === 'DONE' ? driver.name : undefined);
    }

    if (notes !== undefined) {
      await updateTaskNotes(taskId, notes);
    }

    // Log activity
    try {
      const { logActivity } = await import('@/lib/db');
      await logActivity({
        actor: driver.name,
        role: 'staff',
        action: 'driver_task_update',
        details: `${driver.name} updated task ${taskId}${status ? ` → ${status}` : ''}`,
      });
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/driver/tasks error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
