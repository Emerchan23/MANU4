import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('=== INÍCIO LOGIN API ===');
  
  try {
    const body = await request.json();
    console.log('Body recebido:', body);
    
    const { username, password } = body;
    
    if (!username || !password) {
      console.log('Campos obrigatórios ausentes');
      return NextResponse.json({ error: 'Username e password são obrigatórios' }, { status: 400 });
    }
    
    // Teste simples - aceitar admin/admin123
    if (username === 'admin' && password === 'admin123') {
      console.log('Login bem-sucedido para admin');
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
    
    console.log('Credenciais inválidas');
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    
  } catch (error) {
    console.error('Erro geral no login:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}