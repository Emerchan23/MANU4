import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcryptjs';

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
    
    // Primeiro, tentar credenciais hardcoded para compatibilidade
    const testCredentials = {
      'admin': 'admin123',
      'gestor.teste': 'gestor123',
      'tecnico.teste': 'tecnico123',
      'usuario.teste': 'usuario123'
    };
    
    if (testCredentials[username] && testCredentials[username] === password) {
      console.log(`Login bem-sucedido para ${username} (credenciais hardcoded)`);
      
      const isAdmin = username === 'admin';
      
      return NextResponse.json({
        success: true,
        user: {
          id: username === 'admin' ? 1 : (username === 'gestor.teste' ? 23 : (username === 'tecnico.teste' ? 24 : 25)),
          username: username,
          name: username === 'admin' ? 'Administrador' : 
                username === 'gestor.teste' ? 'Gestor de Teste' :
                username === 'tecnico.teste' ? 'Técnico de Teste' : 'Usuário de Teste',
          role: isAdmin ? 'admin' : 'user',
          isAdmin: isAdmin
        }
      });
    }

    // Tentar login com banco de dados
    console.log('Tentando login com banco de dados...');
    
    // Buscar usuário no banco
    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT id, username, full_name, name, nick, password_hash, is_admin, is_active FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      console.log('Usuário não encontrado no banco');
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const user = users[0];
    
    if (!user.is_active) {
      console.log('Usuário inativo');
      return NextResponse.json({ error: 'Usuário inativo' }, { status: 401 });
    }

    // Verificar senha usando bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      console.log('Senha incorreta');
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    console.log(`Login bem-sucedido para ${username} (banco de dados)`);
    
    // Determinar o nome a ser exibido
    const displayName = user.full_name || user.name || user.nick || user.username;
    
    const userData = {
      id: user.id,
      username: user.username,
      nick: user.nick || user.username,
      name: displayName,
      email: user.email || '',
      role: user.is_admin ? 'admin' : 'user',
      isAdmin: Boolean(user.is_admin)
    };
    
    console.log('Dados do usuário preparados:', userData);
    
    // Criar resposta com cookie
    const response = NextResponse.json({
      success: true,
      user: userData
    });
    
    // Definir cookie com dados do usuário
    response.cookies.set('user', JSON.stringify(userData), {
      httpOnly: false, // Permitir acesso via JavaScript
      secure: false, // Para desenvolvimento local
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 dias
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('Erro geral no login:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}