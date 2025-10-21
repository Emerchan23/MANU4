import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== LOGIN SIMPLES ===');
    
    const body = await request.json();
    console.log('Body recebido:', body);
    
    const { username, password } = body;
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Campos obrigatórios' }, { status: 400 });
    }
    
    // Teste simples - aceitar admin/admin123
    if (username === 'admin' && password === 'admin123') {
      return NextResponse.json({
        success: true,
        user: {
          id: 1,
          username: 'admin',
          name: 'Administrador',
          role: 'admin',
          isAdmin: true
        }
      });
    }
    
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    
  } catch (error) {
    console.error('Erro no login simples:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}