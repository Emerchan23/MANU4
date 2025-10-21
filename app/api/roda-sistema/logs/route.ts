import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { formatDateTimeBR } from '@/lib/date-utils';

// Helper function to format log data with Brazilian dates
function formatLogData(log: any) {
  return {
    ...log,
    timestamp: formatDateTimeBR(log.timestamp),
  };
}

// GET - Retrieve rotation logs
export async function GET(request: NextRequest) {
  try {
    // Sistema de autenticação simplificado removido

    const { searchParams } = new URL(request.url);
    const wheelId = searchParams.get('wheelId');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = `
      SELECT 
        rl.*,
        ws.name as wheel_name,
        u.full_name as user_name
      FROM rotation_logs rl
      LEFT JOIN wheel_states ws ON rl.wheel_id = ws.id
      LEFT JOIN users u ON rl.user_id = u.id
    `;

    const params: any[] = [];

    if (wheelId) {
      query += ' WHERE rl.wheel_id = ?';
      params.push(wheelId);
    }

    query += ' ORDER BY rl.timestamp DESC LIMIT ?';
    params.push(limit);

    const [logs] = await pool.query<RowDataPacket[]>(query, params);

    const formattedLogs = logs.map(formatLogData);
    return NextResponse.json(formattedLogs);
  } catch (error) {
    console.error('Error fetching rotation logs:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar logs de rotação' },
      { status: 500 }
    );
  }
}
