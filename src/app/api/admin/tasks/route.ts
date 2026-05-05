import { NextRequest, NextResponse } from 'next/server';
import {
  getAllTasks, ensureAllBookingTasks, updateTaskStatus, updateTaskAssignment, updateTaskNotes,
  setupDatabase, getBorgChecklistsByBooking, createBorgChecklist, getBorgChecklistById, getBookingById,
} from '@/lib/db';
import { sendBorgChecklistEmail } from '@/lib/email';

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
    const { taskId, status, completedBy, assignedTo, notes, sendEmail: shouldSendEmail, bookingId, taskType } = body;

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

    // Send borg checklist email when completing CHECKIN or PICKUP
    if (shouldSendEmail && status === 'DONE' && bookingId && (taskType === 'CHECKIN' || taskType === 'PICKUP')) {
      try {
        const borgType = taskType === 'CHECKIN' ? 'INCHECKEN' : 'UITCHECKEN';
        const borgChecklists = await getBorgChecklistsByBooking(bookingId);
        let checklist = borgChecklists.find((bc: Record<string, unknown>) => bc.type === borgType);

        // Create borg checklist if it doesn't exist
        if (!checklist) {
          const result = await createBorgChecklist({ bookingId, type: borgType, staffName: completedBy });
          checklist = await getBorgChecklistById(result.id);
        }

        if (checklist?.token) {
          const booking = await getBookingById(bookingId);
          if (booking?.guest_email) {
            await sendBorgChecklistEmail({
              to: booking.guest_email,
              guestName: booking.guest_name,
              reference: booking.reference,
              type: borgType as 'INCHECKEN' | 'UITCHECKEN',
              token: checklist.token as string,
              checkIn: booking.check_in,
              checkOut: booking.check_out,
            }, booking.locale || 'nl');
          }
        }
      } catch (emailErr) {
        console.error('Failed to send borg email on task completion (non-fatal):', emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/admin/tasks error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
