import { NextRequest, NextResponse } from 'next/server';
import { executeDeleteConfirmation } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new NextResponse('Ongeldige link', { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  try {
    const result = await executeDeleteConfirmation(token);

    if (!result) {
      return new NextResponse(`
        <!DOCTYPE html>
        <html lang="nl">
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Link verlopen</title>
        <style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#FEF2F2;color:#0F172A}
        .card{background:#fff;border-radius:16px;padding:40px;max-width:480px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.08)}
        h1{font-size:24px;margin:0 0 8px}p{color:#64748B;line-height:1.6;margin:8px 0}
        .icon{font-size:48px;margin-bottom:16px}
        a{color:#1E3A5F;text-decoration:none;font-weight:600}</style></head>
        <body><div class="card">
          <div class="icon">⚠️</div>
          <h1>Link verlopen of ongeldig</h1>
          <p>Deze bevestigingslink is verlopen of al gebruikt. Log in op je account om het opnieuw te proberen.</p>
          <p style="margin-top:20px"><a href="https://caravanverhuurspanje.com/account">Naar inloggen →</a></p>
        </div></body></html>
      `, { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="nl">
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Account verwijderd</title>
      <style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F0F9FF;color:#0F172A}
      .card{background:#fff;border-radius:16px;padding:40px;max-width:480px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.08)}
      h1{font-size:24px;margin:0 0 8px}p{color:#64748B;line-height:1.6;margin:8px 0}
      .icon{font-size:48px;margin-bottom:16px}
      a{color:#1E3A5F;text-decoration:none;font-weight:600}
      .btn{display:inline-block;background:#1E3A5F;color:#fff!important;padding:12px 24px;border-radius:10px;margin-top:12px}</style></head>
      <body><div class="card">
        <div class="icon">👋</div>
        <h1>Account verwijderd</h1>
        <p>Je account en persoonsgegevens zijn definitief verwijderd. We vinden het jammer je te zien gaan.</p>
        <p>Mocht je in de toekomst opnieuw willen boeken, ben je uiteraard welkom!</p>
        <p style="margin-top:20px"><a href="https://caravanverhuurspanje.com" class="btn">Naar de website</a></p>
      </div></body></html>
    `, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (error) {
    console.error('Delete confirm error:', error);
    return new NextResponse('Er ging iets mis', { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}
