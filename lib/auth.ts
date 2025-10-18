import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import pool from './db';
import { RowDataPacket } from 'mysql2';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production-min-32-chars'
);

const JWT_EXPIRATION = '7d'; // 7 dias
const COOKIE_NAME = 'auth_token';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  roles: string[];
}

export interface Session {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
}

export interface Permission {
  module_name: string;
  module_route: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
}

/**
 * Cria um token JWT e armazena a sessão no banco de dados
 */
export async function createSession(
  userId: number,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

  // Criar JWT
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(JWT_SECRET);

  // Salvar sessão no banco de dados (apenas session_id, user_id e expires_at)
  await pool.execute(
    `INSERT INTO user_sessions (user_id, session_id, expires_at)
     VALUES (?, ?, ?)`,
    [userId, token, expiresAt]
  );

  return token;
}

/**
 * Verifica e valida um token JWT
 */
export async function verifyToken(token: string): Promise<{ userId: number } | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as { userId: number };
  } catch (error) {
    return null;
  }
}

/**
 * Busca sessão ativa no banco de dados
 */
export async function getSessionFromDB(token: string): Promise<Session | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, user_id, session_id, expires_at
     FROM user_sessions
     WHERE session_id = ? AND expires_at > NOW()`,
    [token]
  );

  if (rows.length === 0) return null;

  const session = rows[0];
  return {
    id: session.id,
    user_id: session.user_id,
    token: session.session_id,
    expires_at: session.expires_at
  } as Session;
}

/**
 * Busca usuário completo com roles
 */
export async function getUserById(userId: number): Promise<User | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 
      u.id,
      u.username,
      u.email,
      u.full_name,
      u.is_active,
      u.is_admin,
      GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ',') as roles
     FROM users u
     LEFT JOIN user_roles ur ON u.id = ur.user_id
     LEFT JOIN roles r ON ur.role_id = r.id
     WHERE u.id = ? AND u.is_active = TRUE
     GROUP BY u.id`,
    [userId]
  );

  if (rows.length === 0) return null;

  const user = rows[0];
  return {
    ...user,
    roles: user.roles ? user.roles.split(',') : []
  } as User;
}

/**
 * Busca permissões do usuário
 */
export async function getUserPermissions(userId: number): Promise<Permission[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT
      m.name as module_name,
      m.route as module_route,
      MAX(p.can_view) as can_view,
      MAX(p.can_create) as can_create,
      MAX(p.can_edit) as can_edit,
      MAX(p.can_delete) as can_delete,
      MAX(p.can_export) as can_export
     FROM users u
     JOIN user_roles ur ON u.id = ur.user_id
     JOIN permissions p ON ur.role_id = p.role_id
     JOIN modules m ON p.module_id = m.id
     WHERE u.id = ? AND u.is_active = TRUE
     GROUP BY m.name, m.route
     ORDER BY m.name`,
    [userId]
  );

  return rows.map((row: RowDataPacket) => ({
    module_name: row.module_name as string,
    module_route: row.module_route as string,
    can_view: Boolean(row.can_view),
    can_create: Boolean(row.can_create),
    can_edit: Boolean(row.can_edit),
    can_delete: Boolean(row.can_delete),
    can_export: Boolean(row.can_export)
  }));
}

/**
 * Obtém usuário autenticado da requisição
 */
export async function getCurrentUser(request?: NextRequest): Promise<User | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    // Verificar JWT
    const payload = await verifyToken(token);
    if (!payload) return null;

    // Verificar sessão no banco
    const session = await getSessionFromDB(token);
    if (!session) return null;

    // Buscar usuário
    const user = await getUserById(payload.userId);
    return user;
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
    return null;
  }
}

/**
 * Verifica se usuário tem permissão para um módulo
 */
export async function hasPermission(
  userId: number,
  moduleName: string,
  action: 'view' | 'create' | 'edit' | 'delete' | 'export'
): Promise<boolean> {
  // Admin tem acesso total
  const user = await getUserById(userId);
  if (user?.is_admin) return true;

  const permissions = await getUserPermissions(userId);
  const modulePermission = permissions.find(p => p.module_name === moduleName);

  if (!modulePermission) return false;

  switch (action) {
    case 'view':
      return modulePermission.can_view;
    case 'create':
      return modulePermission.can_create;
    case 'edit':
      return modulePermission.can_edit;
    case 'delete':
      return modulePermission.can_delete;
    case 'export':
      return modulePermission.can_export;
    default:
      return false;
  }
}

/**
 * Remove sessão (logout)
 */
export async function destroySession(token: string): Promise<void> {
  await pool.execute(
    'DELETE FROM user_sessions WHERE session_id = ?',
    [token]
  );
}

/**
 * Registra log de acesso
 */
export async function logAccess(
  userId: number | null,
  action: string,
  module?: string,
  ipAddress?: string,
  userAgent?: string,
  details?: string
): Promise<void> {
  await pool.execute(
    `INSERT INTO access_logs (user_id, action, module, ip_address, user_agent, details)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, action, module || null, ipAddress || null, userAgent || null, details || null]
  );
}

/**
 * Atualiza último login do usuário
 */
export async function updateLastLogin(userId: number): Promise<void> {
  await pool.execute(
    'UPDATE users SET last_login = NOW() WHERE id = ?',
    [userId]
  );
}

/**
 * Limpa sessões expiradas
 */
export async function cleanExpiredSessions(): Promise<void> {
  await pool.execute('DELETE FROM user_sessions WHERE expires_at < NOW()');
}
