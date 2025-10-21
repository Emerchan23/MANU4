import { NextResponse } from 'next/server'

// Endpoint super simples para testar se o problema é específico do equipment
export async function PUT(request: Request) {
  try {
    console.log('🧪 SIMPLE TEST - Endpoint simples para debug...');
    
    // Tentar ler o body de forma simples
    const body = await request.text();
    console.log('📊 Body recebido:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Endpoint simples funcionando',
      receivedBody: body
    });
  } catch (error) {
    console.error('❌ Erro no endpoint simples:', error);
    return NextResponse.json(
      { success: false, message: 'Erro no endpoint simples', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'GET funcionando no endpoint simples'
  });
}