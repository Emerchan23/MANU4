import { NextRequest, NextResponse } from 'next/server';

// POST - Teste simples
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [EQUIPMENT TEST] POST - Iniciando teste...');
    
    const body = await request.json();
    console.log('📊 [EQUIPMENT TEST] Body recebido:', body);
    
    return NextResponse.json({
      success: true,
      message: 'API de teste funcionando',
      data: body
    }, { status: 200 });

  } catch (error) {
    console.error('❌ [EQUIPMENT TEST] Erro:', error);
    return NextResponse.json(
      { success: false, message: 'Erro no teste', error: error.message },
      { status: 500 }
    );
  }
}

// GET - Teste simples
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API de teste GET funcionando'
  });
}