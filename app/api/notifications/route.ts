import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise'

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const isRead = searchParams.get('isRead');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig)

    let query = `
      SELECT * FROM notifications 
      WHERE user_id = ?
    `;
    const params: any[] = [userId];

    // Aplicar filtros
    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }

    if (priority) {
      query += ` AND priority = ?`;
      params.push(priority);
    }

    if (isRead !== null && isRead !== undefined) {
      query += ` AND is_read = ?`;
      params.push(isRead === 'true');
    }

    if (startDate) {
      query += ` AND created_at >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND created_at <= ?`;
      params.push(endDate);
    }

    // Ordenar por data de criação (mais recentes primeiro)
    query += ' ORDER BY created_at DESC';

    // Paginação
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await connection.execute(query, params);

    // Contar total de notificações para paginação
    let countQuery = `
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ?
    `;
    const countParams: any[] = [userId];

    if (type) {
      countQuery += ` AND type = ?`;
      countParams.push(type);
    }

    if (priority) {
      countQuery += ` AND priority = ?`;
      countParams.push(priority);
    }

    if (isRead !== null && isRead !== undefined) {
      countQuery += ` AND is_read = ?`;
      countParams.push(isRead === 'true');
    }

    if (startDate) {
      countQuery += ` AND created_at >= ?`;
      countParams.push(startDate);
    }

    if (endDate) {
      countQuery += ` AND created_at <= ?`;
      countParams.push(endDate);
    }

    const [countRows] = await connection.execute(countQuery, countParams);
    const total = parseInt((countRows as any)[0].count);

    await connection.end()

    return NextResponse.json({
      notifications: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, title, message, priority, relatedId, relatedType } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, type, title, message' 
      }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig)

    const [result] = await connection.execute(`
      INSERT INTO notifications (user_id, type, title, message, priority, related_id, related_type, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)
    `, [userId, type, title, message, priority || 'medium', relatedId, relatedType]);

    // Buscar a notificação criada
    const [rows] = await connection.execute(`
      SELECT * FROM notifications WHERE id = ?
    `, [(result as any).insertId]);

    await connection.end()

    return NextResponse.json((rows as any)[0], { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}