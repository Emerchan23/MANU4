import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '7';
    const entityType = searchParams.get('entityType');
    const result = searchParams.get('result');
    const format = searchParams.get('format') || 'csv';

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
    `, queryParams);

    if (format === 'csv') {
      // Generate CSV
      const headers = ['ID', 'Tipo de Entidade', 'ID da Entidade', 'Tipo de Validação', 'Resultado', 'Dependências', 'Mensagem de Erro', 'Data de Criação'];
      const csvRows = [
        headers.join(','),
        ...logs.map((log: any) => [
          log.id,
          log.entity_type,
          log.entity_id,
          log.validation_type,
          log.validation_result,
          log.dependency_count,
          `"${(log.error_message || '').replace(/"/g, '""')}"`,
          new Date(log.created_at).toLocaleString('pt-BR')
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="validation-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else if (format === 'json') {
      // Generate JSON
      const jsonContent = JSON.stringify({
        exportDate: new Date().toISOString(),
        filters: {
          days,
          entityType: entityType || 'all',
          result: result || 'all'
        },
        totalRecords: logs.length,
        data: logs
      }, null, 2);

      return new NextResponse(jsonContent, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="validation-report-${new Date().toISOString().split('T')[0]}.json"`
        }
      });
    }

    return NextResponse.json(
      { error: 'Formato não suportado' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error exporting validation report:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}