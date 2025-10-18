import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '7';
    const entityType = searchParams.get('entityType');
    const result = searchParams.get('result');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let whereConditions = [`created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`];
    let queryParams: any[] = [];

    if (entityType) {
      whereConditions.push('entity_type = ?');
      queryParams.push(entityType);
    }

    if (result) {
      whereConditions.push('validation_result = ?');
      queryParams.push(result);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const logs = await query(`
      SELECT 
        id,
        entity_type,
        entity_id,
        validation_type,
        validation_result,
        dependency_count,
        error_message,
        created_at
      FROM validation_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, queryParams);

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching validation logs:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}