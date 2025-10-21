import { NextResponse } from 'next/server';

export async function GET() {
  console.log('=== TESTE GET ===');
  return NextResponse.json({ message: 'API funcionando', timestamp: new Date().toISOString() });
}

export async function POST() {
  console.log('=== TESTE POST ===');
  return NextResponse.json({ message: 'POST funcionando', timestamp: new Date().toISOString() });
}