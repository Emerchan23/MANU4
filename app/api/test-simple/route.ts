import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'GET funcionando' });
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST simples recebido');
    const body = await request.json();
    console.log('Body recebido:', body);
    
    return NextResponse.json({ 
      message: 'POST funcionando',
      received: body 
    });
  } catch (error: unknown) {
    console.error('Erro no POST simples:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro no POST simples', details: errorMessage },
      { status: 500 }
    );
  }
}