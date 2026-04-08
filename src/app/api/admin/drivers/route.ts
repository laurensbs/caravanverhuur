import { NextRequest, NextResponse } from 'next/server';
import { getDrivers, getActiveDrivers, createDriver, updateDriver, deleteDriver, setupDatabase, seedDefaultDrivers } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const activeOnly = request.nextUrl.searchParams.get('active') === 'true';
    try {
      await seedDefaultDrivers();
      const drivers = activeOnly ? await getActiveDrivers() : await getDrivers();
      return NextResponse.json({ drivers });
    } catch {
      await setupDatabase();
      await seedDefaultDrivers();
      const drivers = activeOnly ? await getActiveDrivers() : await getDrivers();
      return NextResponse.json({ drivers });
    }
  } catch (error) {
    console.error('GET /api/admin/drivers error:', error);
    return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, phone } = await request.json();
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const result = await createDriver(name.trim(), phone?.trim());
    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/admin/drivers error:', error);
    return NextResponse.json({ error: 'Failed to create driver' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, name, phone, active, sort_order, pin, locale, password_hash } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    await updateDriver(id, { name, phone, active, sort_order, pin, locale, password_hash });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/admin/drivers error:', error);
    return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    await deleteDriver(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/drivers error:', error);
    return NextResponse.json({ error: 'Failed to delete driver' }, { status: 500 });
  }
}
