import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Test GET works' });
}

export async function POST(request: NextRequest) {
  try {
    console.log('Test POST called');
    const data = await request.json();
    console.log('Test POST data:', data);
    return NextResponse.json({ message: 'Test POST works', data });
  } catch (error) {
    console.error('Test POST error:', error);
    return NextResponse.json({ error: 'Test POST failed' }, { status: 500 });
  }
}