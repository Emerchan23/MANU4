import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise'

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { isRead } = body;

    if (isRead === undefined) {
      return NextResponse.json({ error: 'isRead field is required' }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig)

    const [result] = await connection.execute(`
      UPDATE notifications 
      SET is_read = ?, read_at = ?
      WHERE id = ?
    `, [isRead, isRead ? new Date() : null, id]);

    if ((result as any).affectedRows === 0) {
      await connection.end()
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Buscar a notificação atualizada
    const [rows] = await connection.execute(`
      SELECT * FROM notifications WHERE id = ?
    `, [id]);

    await connection.end()

    return NextResponse.json((rows as any)[0]);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const connection = await mysql.createConnection(dbConfig)

    const [result] = await connection.execute(`
      DELETE FROM notifications 
      WHERE id = ?
    `, [id]);

    await connection.end()

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}