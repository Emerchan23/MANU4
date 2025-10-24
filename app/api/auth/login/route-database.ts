import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// Função para hash SHA256 (compatibilidade com cadastro)
function hashPasswordSHA256(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== LOGIN COM BANCO DE DADOS ===');
    
    const body = await request.json();
    console.log('Body recebido:', { username: body.username, password: '[OCULTA]' });
    
    const { username, password } = body;
    
    if (!username || !password) {
      console.log('❌ Campos obrigatórios ausentes');
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios' }, { status: 400 });
    }
    
    // Buscar usuário no banco de dados
    console.log('🔍 Buscando usuário no banco:', username);
    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT id, username, email, full_name, password_hash, is_active, is_admin FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (users.length === 0) {
      console.log('❌ Usuário não encontrado:', username);
      return NextResponse.json({ error: 'Usuário ou senha inválido' }, { status: 401 });
    }

    const user = users[0];
    console.log('✅ Usuário encontrado:', {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      is_active: user.is_active,
      is_admin: user.is_admin,
      has_password_hash: !!user.password_hash,
      password_hash_length: user.password_hash ? user.password_hash.length : 0
    });

    // Verificar se usuário está ativo
    if (!user.is_active) {
      console.log('❌ Usuário inativo:', username);
      return NextResponse.json({ error: 'Usuário inativo' }, { status: 401 });
    }

    // Verificar senha - suportar tanto SHA256 quanto bcrypt
    let passwordValid = false;
    
    if (!user.password_hash) {
      console.log('❌ Usuário sem senha definida:', username);
      return NextResponse.json({ error: 'Usuário sem senha definida' }, { status: 401 });
    }

    // Verificar se é bcrypt (começa com $2)
    if (user.password_hash.startsWith('$2')) {
      console.log('🔐 Verificando senha com bcrypt...');
      try {
        passwordValid = await bcrypt.compare(password, user.password_hash);
        console.log('bcrypt result:', passwordValid);
      } catch (error) {
        console.log('❌ Erro ao verificar bcrypt:', error);
      }
    } else {
      // Assumir SHA256 (64 caracteres hex)
      console.log('🔐 Verificando senha com SHA256...');
      const sha256Hash = hashPasswordSHA256(password);
      passwordValid = user.password_hash === sha256Hash;
      console.log('SHA256 comparison:', {
        stored: user.password_hash,
        calculated: sha256Hash,
        match: passwordValid
      });
    }

    if (!passwordValid) {
      console.log('❌ Senha inválida para usuário:', username);
      return NextResponse.json({ error: 'Usuário ou senha inválido' }, { status: 401 });
    }

    // Atualizar último login
    await pool.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Preparar dados do usuário para resposta
    const userData = {
      id: user.id,
      username: user.username,
      name: user.full_name || user.username,
      email: user.email,
      role: user.is_admin ? 'ADMIN' : 'USER',
      isAdmin: Boolean(user.is_admin)
    };

    console.log('✅ Login realizado com sucesso:', {
      id: userData.id,
      username: userData.username,
      name: userData.name,
      role: userData.role
    });

    // Criar resposta com cookie para o middleware
    const response = NextResponse.json({
      success: true,
      user: userData
    });

    // Definir cookie 'user' que o middleware espera
    response.cookies.set('user', JSON.stringify(userData), {
      httpOnly: false, // Permitir acesso via JavaScript para o frontend
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/'
    });

    return response;
    
  } catch (error) {
    console.error('❌ Erro no login:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}