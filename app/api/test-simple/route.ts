import { NextRequest, NextResponse } from 'next/server';

// Rota de teste ultra simples para verificar se o problema é no Next.js
export async function PUT(request: NextRequest) {
  console.log('🧪 SIMPLE TEST PUT - Iniciando...');
  
  try {
    console.log('✅ SIMPLE TEST PUT - Sucesso!');

    return NextResponse.json({
      success: true,
      message: 'Teste simples funcionando'
    });

  } catch (error: any) {
    console.error('❌ Erro no SIMPLE TEST PUT:', error);
    
    return NextResponse.json(
      { success: false, message: 'Erro no teste simples', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('🧪 SIMPLE TEST GET - Iniciando...');
  
  try {
    console.log('✅ SIMPLE TEST GET - Sucesso!');

    return NextResponse.json({
      success: true,
      message: 'Teste simples GET funcionando'
    });

  } catch (error: any) {
    console.error('❌ Erro no SIMPLE TEST GET:', error);
    
    return NextResponse.json(
      { success: false, message: 'Erro no teste simples GET', error: error.message },
      { status: 500 }
    );
  }
}