import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Função simples para hash de senha
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// GET - Buscar usuário específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Sistema de autenticação simplificado removido
    return NextResponse.json(
      { error: 'Endpoint desabilitado - sistema de autenticação simplificado' },
      { status: 501 }
    );

    const userId = params.id;

    // Buscar usuário
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
        GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ',') as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = ?
       GROUP BY u.id`,
      [userId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const user = rows[0];
    return NextResponse.json({
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      name: user.name,
      isActive: Boolean(user.isActive),
      is_admin: Boolean(user.is_admin),
      role: user.is_admin ? 'ADMIN' : (user.roles ? user.roles.split(',')[0].toUpperCase() : 'USUARIO'),
      roles: user.roles ? user.roles.split(',') : [],
      allowedSectors: [],
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Apenas admin pode editar usuários
    if (!currentUser.is_admin) {
      return NextResponse.json(
        { error: 'Sem permissão para editar usuários' },
        { status: 403 }
      );
    }

    const userId = params.id;
    const data = await request.json();
    const { name, email, username, password, role, isActive } = data;

    // Verificar se usuário existe
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Construir query de atualização
    const updates: string[] = [];
    const values: any[] = [];

    if (name) {
      updates.push('full_name = ?');
      values.push(name);
    }

    if (email) {
      updates.push('email = ?');
      values.push(email);
    }

    if (username) {
      // Verificar se username já existe para outro usuário
      const [existingUsername] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, userId]
      );

      if (existingUsername.length > 0) {
        return NextResponse.json(
          { error: 'Nome de usuário já está em uso' },
          { status: 400 }
        );
      }

      updates.push('username = ?');
      values.push(username);
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      values.push(passwordHash);
    }

    if (typeof isActive === 'boolean') {
      updates.push('is_active = ?');
      values.push(isActive);
    }

    if (role) {
      const isAdmin = role === 'ADMIN' || role === 'admin';
      updates.push('is_admin = ?');
      values.push(isAdmin);
    }

    if (updates.length > 0) {
      values.push(userId);
      await pool.execute(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    // Atualizar roles
    if (role) {
      // Remover roles antigas
      await pool.execute('DELETE FROM user_roles WHERE user_id = ?', [userId]);

      // Adicionar nova role
      const isAdmin = role === 'ADMIN' || role === 'admin';
      const roleName = isAdmin ? 'admin' : role.toLowerCase();

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
    }

    // Log da ação
    await logAccess(
      currentUser.id,
      'user_updated',
      'users',
      request.ip,
      request.headers.get('user-agent') || undefined,
      `Usuário atualizado: ID ${userId}`
    );

    // Buscar usuário atualizado
    const [updated] = await pool.execute<RowDataPacket[]>(
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

    const user = updated[0];
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
    });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Apenas admin pode deletar usuários
    if (!currentUser.is_admin) {
      return NextResponse.json(
        { error: 'Sem permissão para deletar usuários' },
        { status: 403 }
      );
    }

    const userId = params.id;

    // Não permitir deletar a si mesmo
    if (currentUser.id.toString() === userId) {
      return NextResponse.json(
        { error: 'Não é possível deletar seu próprio usuário' },
        { status: 400 }
      );
    }

    // Verificar se usuário existe
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT username FROM users WHERE id = ?',
      [userId]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Deletar usuário (cascade vai deletar roles e sessões)
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

    // Log da ação
    await logAccess(
      currentUser.id,
      'user_deleted',
      'users',
      request.ip,
      request.headers.get('user-agent') || undefined,
      `Usuário deletado: ${existing[0].username}`
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar usuário' },
      { status: 500 }
    );
  }
}
