import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/account?verified=error', request.url));
    }

    const result = await verifyEmailToken(token);
    if (!result) {
      return NextResponse.redirect(new URL('/account?verified=expired', request.url));
    }

    return NextResponse.redirect(new URL('/mijn-account?verified=true', request.url));
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(new URL('/account?verified=error', request.url));
  }
}
