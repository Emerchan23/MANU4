import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Função simples para hash de senha
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// GET - Listar todos os usuários
export async function GET(request: NextRequest) {
  try {
    // Sistema de autenticação simplificado removido
    return NextResponse.json(
      { error: 'Endpoint desabilitado - sistema de autenticação simplificado' },
      { status: 501 }
    );
      return NextResponse.json(
        { error: 'Sem permissão para listar usuários' },
        { status: 403 }
      );
    }

    // Buscar todos os usuários com seus roles
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.full_name as name,
        u.is_active as isActive,
        u.is_admin,
        u.created_at as createdAt,
        u.last_login as lastLogin,
        GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ',') as roles,
        GROUP_CONCAT(DISTINCT ur.role_id ORDER BY ur.role_id SEPARATOR ',') as roleIds
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    // Transformar para o formato esperado pelo frontend
    const users = rows.map((user: RowDataPacket) => ({
      id: user.id.toString(),
      username: user.username as string,
      email: user.email as string,
      name: user.name as string,
      isActive: Boolean(user.isActive),
      is_admin: Boolean(user.is_admin),
      role: user.is_admin ? 'ADMIN' : (user.roles ? (user.roles as string).split(',')[0].toUpperCase() : 'USUARIO'),
      roles: user.roles ? (user.roles as string).split(',') : [],
      roleIds: user.roleIds ? (user.roleIds as string).split(',').map(Number) : [],
      allowedSectors: [], // TODO: Implementar setores se necessário
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }));

    return NextResponse.json(users);

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao listar usuários' },
      { status: 500 }
    );
  }
}

// POST - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Apenas admin pode criar usuários
    if (!currentUser.is_admin) {
      return NextResponse.json(
        { error: 'Sem permissão para criar usuários' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { name, email, username, password, role, isActive } = data;

    // Validações
    if (!name || !email || !username || !password) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, email, username, password' },
        { status: 400 }
      );
    }

    // Verificar se username ou email já existem
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Usuário ou e-mail já cadastrado' },
        { status: 400 }
      );
    }

    // Hash da senha
    const passwordHash = hashPassword(password);

    // Determinar se é admin
    const isAdmin = role === 'ADMIN' || role === 'admin';

    // Inserir usuário
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (username, email, password_hash, full_name, is_active, is_admin)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, name, isActive !== false, isAdmin]
    );

    const userId = result.insertId;

    // Associar role (se não for admin)
    if (!isAdmin && role) {
      // Buscar role_id pelo nome
      const roleName = role.toLowerCase();
      const [roleRows] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM roles WHERE name = ?',
        [roleName]
      );

      if (roleRows.length > 0) {
        await pool.execute(
          'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
          [userId, roleRows[0].id]
        );
      }
    } else if (isAdmin) {
      // Admin recebe o role 'admin'
      const [roleRows] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM roles WHERE name = ?',
        ['admin']
      );

      if (roleRows.length > 0) {
        await pool.execute(
          'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
          [userId, roleRows[0].id]
        );
      }
    }

    // Log da ação
    await logAccess(
      currentUser.id,
      'user_created',
      'users',
      request.ip,
      request.headers.get('user-agent') || undefined,
      `Usuário criado: ${username}`
    );

    // Buscar usuário criado
    const [newUser] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.full_name as name,
        u.is_active as isActive,
        u.is_admin,
        GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ',') as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = ?
       GROUP BY u.id`,
      [userId]
    );

    const user = newUser[0];
    return NextResponse.json({
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      name: user.name,
      isActive: Boolean(user.isActive),
      is_admin: Boolean(user.is_admin),
      role: user.is_admin ? 'ADMIN' : (user.roles ? user.roles.split(',')[0].toUpperCase() : 'USUARIO'),
      roles: user.roles ? user.roles.split(',') : [],
      allowedSectors: []
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}
