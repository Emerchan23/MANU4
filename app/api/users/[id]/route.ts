import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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
    // Sistema de autenticação simplificado - permitir acesso direto
    console.log('🔄 Atualizando usuário ID:', params.id);

    const userId = params.id;
    const data = await request.json();
    const { name, full_name, email, username, password, role, isActive, is_active, is_admin } = data;

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

    if (name || full_name) {
      updates.push('full_name = ?');
      values.push(name || full_name);
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

    if (typeof isActive === 'boolean' || typeof is_active === 'boolean') {
      updates.push('is_active = ?');
      values.push(isActive !== undefined ? isActive : is_active);
    }

    if (role || typeof is_admin === 'boolean') {
      const isAdminValue = is_admin !== undefined ? is_admin : (role === 'ADMIN' || role === 'admin');
      updates.push('is_admin = ?');
      values.push(isAdminValue);
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

    // Log da ação (simplificado)
    console.log(`✅ Usuário atualizado: ID ${userId}`);

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
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário', details: error.message },
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
    // Sistema de autenticação simplificado - permitir acesso direto
    console.log('🗑️ Deletando usuário ID:', params.id);

    const userId = params.id;

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

    // Verificar vínculos com outras tabelas
    const dependencies = [];

    // Verificar ordens de serviço como solicitante
    const [serviceOrdersRequester] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM service_orders WHERE requester_id = ?',
      [userId]
    );
    if (serviceOrdersRequester[0].count > 0) {
      dependencies.push(`${serviceOrdersRequester[0].count} ordem(ns) de serviço como solicitante`);
    }

    // Verificar ordens de serviço como técnico responsável
    const [serviceOrdersTechnician] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM service_orders WHERE assigned_technician_id = ?',
      [userId]
    );
    if (serviceOrdersTechnician[0].count > 0) {
      dependencies.push(`${serviceOrdersTechnician[0].count} ordem(ns) de serviço como técnico responsável`);
    }

    // Verificar notificações
    const [notifications] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ?',
      [userId]
    );
    if (notifications[0].count > 0) {
      dependencies.push(`${notifications[0].count} notificação(ões)`);
    }

    // Verificar logs de acesso
    const [accessLogs] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM access_logs WHERE user_id = ?',
      [userId]
    );
    if (accessLogs[0].count > 0) {
      dependencies.push(`${accessLogs[0].count} log(s) de acesso`);
    }

    // Verificar sessões ativas
    const [userSessions] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ?',
      [userId]
    );
    if (userSessions[0].count > 0) {
      dependencies.push(`${userSessions[0].count} sessão(ões) ativa(s)`);
    }

    // Verificar histórico de manutenção
    const [maintenanceHistory] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM maintenance_history WHERE performed_by = ?',
      [userId]
    );
    if (maintenanceHistory[0].count > 0) {
      dependencies.push(`${maintenanceHistory[0].count} registro(s) de manutenção`);
    }

    // Verificar agendamentos de manutenção
    const [maintenanceSchedule] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM maintenance_schedule WHERE created_by = ?',
      [userId]
    );
    if (maintenanceSchedule[0].count > 0) {
      dependencies.push(`${maintenanceSchedule[0].count} agendamento(s) de manutenção`);
    }

    // Verificar configurações do sistema
    const [systemSettings] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM system_settings WHERE updated_by = ?',
      [userId]
    );
    if (systemSettings[0].count > 0) {
      dependencies.push(`${systemSettings[0].count} configuração(ões) do sistema`);
    }

    // Verificar log de auditoria
    const [auditLog] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM audit_log WHERE user_id = ?',
      [userId]
    );
    if (auditLog[0].count > 0) {
      dependencies.push(`${auditLog[0].count} registro(s) de auditoria`);
    }

    // Se houver dependências, retornar erro com detalhes
    if (dependencies.length > 0) {
      const totalDependencies = dependencies.reduce((total, dep) => {
        const count = parseInt(dep.split(' ')[0]);
        return total + count;
      }, 0);

      return NextResponse.json(
        {
          error: 'Não é possível excluir este usuário',
          message: `O usuário "${existing[0].username}" possui vínculos com outros registros no sistema e não pode ser excluído.`,
          details: `Registros vinculados: ${dependencies.join(', ')}.`,
          suggestion: 'Para excluir este usuário, primeiro remova ou transfira os registros vinculados para outro usuário.',
          dependencyCount: totalDependencies,
          dependencies: dependencies
        },
        { status: 409 }
      );
    }

    // Se não houver dependências, deletar usuário
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

    // Log da ação (simplificado)
    console.log(`✅ Usuário deletado: ${existing[0].username}`);

    return NextResponse.json({ 
      success: true,
      message: `Usuário "${existing[0].username}" excluído com sucesso.`
    });

  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor ao deletar usuário' },
      { status: 500 }
    );
  }
}
