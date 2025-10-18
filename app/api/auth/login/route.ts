import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import {
  createSession,
  getUserById,
  getUserPermissions,
  logAccess,
  updateLastLogin
} from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

// Função para hash de senha usando SHA256 (para compatibilidade)
function hashPasswordSHA256(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Função para verificar senha (suporta bcrypt e SHA256)
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Se o hash começa com $2b$, é bcrypt
  if (hash.startsWith('$2b$') || hash.startsWith('$2a$')) {
    return await bcrypt.compare(password, hash);
  }
  
  // Caso contrário, assume SHA256
  const sha256Hash = hashPasswordSHA256(password);
  return hash === sha256Hash;
}

export async function POST(request: NextRequest) {
  let connection;

  try {
    const body = await request.json();
    const { username, password } = body;

    // Validação dos campos obrigatórios
    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuário/e-mail e senha são obrigatórios'
        },
        { status: 400 }
      );
    }

    // Validação de formato
    if (typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Formato inválido de credenciais'
        },
        { status: 400 }
      );
    }

    // Validação de tamanho
    if (username.trim().length === 0 || password.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuário/e-mail e senha não podem estar vazios'
        },
        { status: 400 }
      );
    }

    console.log('🔐 Tentativa de login:', { username: username.trim() });

    // Buscar usuário no banco (por username OU email)
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        id,
        username,
        email,
        password_hash,
        full_name,
        is_active,
        is_admin
      FROM users
      WHERE (username = ? OR email = ?)`,
      [username.trim(), username.trim()]
    );

    // Usuário não encontrado
    if (rows.length === 0) {
      console.log('❌ Usuário não encontrado:', username.trim());

      await logAccess(
        null,
        'login_failed',
        'auth',
        request.ip,
        request.headers.get('user-agent') || undefined,
        `Usuário não encontrado: ${username.trim()}`
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Usuário ou senha inválidos'
        },
        { status: 401 }
      );
    }

    const user = rows[0];
    console.log('✅ Usuário encontrado:', {
      id: user.id,
      username: user.username,
      email: user.email,
      is_active: user.is_active
    });

    // Verificar se usuário está ativo
    if (!user.is_active) {
      console.log('❌ Usuário inativo:', user.username);

      await logAccess(
        user.id,
        'login_failed',
        'auth',
        request.ip,
        request.headers.get('user-agent') || undefined,
        'Tentativa de login com usuário inativo'
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Usuário inativo. Entre em contato com o administrador.'
        },
        { status: 403 }
      );
    }

    // Verificar se o hash da senha existe
    if (!user.password_hash) {
      console.log('❌ Hash de senha não configurado para:', user.username);

      await logAccess(
        user.id,
        'login_failed',
        'auth',
        request.ip,
        request.headers.get('user-agent') || undefined,
        'Hash de senha não configurado'
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Senha não configurada. Entre em contato com o administrador.'
        },
        { status: 500 }
      );
    }

    // Verificar senha
    const passwordMatch = await verifyPassword(password, user.password_hash);

    console.log('🔑 Verificação de senha:', {
      match: passwordMatch,
      hashType: user.password_hash.startsWith('$2b$') ? 'bcrypt' : 'SHA256'
    });

    if (!passwordMatch) {
      console.log('❌ Senha incorreta para:', user.username);

      await logAccess(
        user.id,
        'login_failed',
        'auth',
        request.ip,
        request.headers.get('user-agent') || undefined,
        'Senha incorreta'
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Usuário ou senha inválidos'
        },
        { status: 401 }
      );
    }

    console.log('✅ Senha válida! Criando sessão...');

    // Criar sessão
    const token = await createSession(
      user.id,
      request.ip,
      request.headers.get('user-agent') || undefined
    );

    console.log('✅ Sessão criada com sucesso');

    // Atualizar último login
    await updateLastLogin(user.id);

    // Buscar dados completos do usuário
    const fullUser = await getUserById(user.id);

    if (!fullUser) {
      console.log('❌ Erro ao buscar dados completos do usuário');
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao carregar dados do usuário'
        },
        { status: 500 }
      );
    }

    // Buscar permissões do usuário
    const permissions = await getUserPermissions(user.id);

    console.log('✅ Dados do usuário carregados:', {
      id: fullUser.id,
      username: fullUser.username,
      roles: fullUser.roles,
      permissionsCount: permissions.length
    });

    // Log de sucesso
    await logAccess(
      user.id,
      'login_success',
      'auth',
      request.ip,
      request.headers.get('user-agent') || undefined,
      'Login realizado com sucesso'
    );

    // Definir cookie HTTP-only seguro
    const cookieStore = cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/'
    });

    console.log('✅ Login concluído com sucesso para:', user.username);

    // Retornar resposta de sucesso
    return NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: fullUser.id,
        username: fullUser.username,
        email: fullUser.email,
        full_name: fullUser.full_name,
        is_admin: fullUser.is_admin,
        roles: fullUser.roles
      },
      permissions
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);

    // Log de erro
    try {
      await logAccess(
        null,
        'login_error',
        'auth',
        request.ip,
        request.headers.get('user-agent') || undefined,
        `Erro no sistema: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    } catch (logError) {
      console.error('Erro ao registrar log:', logError);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao realizar login. Tente novamente.'
      },
      { status: 500 }
    );
  }
}
