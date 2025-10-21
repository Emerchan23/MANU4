import { NextRequest, NextResponse } from 'next/server';

// POST - Criar equipamento (versão simplificada para teste)
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [EQUIPMENT NEW] POST - Iniciando...');
    
    const body = await request.json();
    console.log('📊 [EQUIPMENT NEW] Body:', body);
    
    // Simular criação bem-sucedida
    return NextResponse.json({
      success: true,
      message: 'Equipamento criado com sucesso (simulado)',
      id: Math.floor(Math.random() * 1000),
      data: body
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [EQUIPMENT NEW] Erro:', error);
    return NextResponse.json(
      { success: false, message: 'Erro', error: error.message },
      { status: 500 }
    );
  }
}

// GET - Listar equipamentos (versão simplificada)
export async function GET() {
  return NextResponse.json({
    success: true,
    data: [],
    total: 0
  });
}