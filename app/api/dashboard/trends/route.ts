import { NextRequest, NextResponse } from 'next/server'
import { getConnection } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const metric = searchParams.get('metric') || 'equipment_efficiency'
    const period = searchParams.get('period') || '7d'
    const limit = parseInt(searchParams.get('limit') || '30')

    const connection = await getConnection()
    
    // Definir período baseado no parâmetro
    let dateFilter = ''
    switch (period) {
      case '24h':
        dateFilter = 'AND recorded_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)'
        break
      case '7d':
        dateFilter = 'AND recorded_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
        break
      case '30d':
        dateFilter = 'AND recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
        break
      case '90d':
        dateFilter = 'AND recorded_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)'
        break
      default:
        dateFilter = 'AND recorded_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    }

    // Buscar dados de tendência
    const [trends] = await connection.execute(`
      SELECT 
        metric_name,
        value,
        recorded_at,
        JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.unit')) as unit,
        JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.category')) as category
      FROM trend_data
      WHERE metric_name = ? ${dateFilter}
      ORDER BY recorded_at ASC
      LIMIT ?
    `, [metric, limit])

    // Calcular estatísticas
    const values = trends.map((t: any) => parseFloat(t.value))
    const stats = {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      count: values.length,
      trend: values.length > 1 ? (values[values.length - 1] > values[0] ? 'up' : 'down') : 'stable'
    }

    // Buscar métricas disponíveis
    const [availableMetrics] = await connection.execute(`
      SELECT DISTINCT metric_name, 
        JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.display_name')) as display_name,
        JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.unit')) as unit
      FROM trend_data
      ORDER BY metric_name
    `)

    await connection.end()

    return NextResponse.json({
      success: true,
      data: {
        metric,
        period,
        trends,
        stats,
        availableMetrics
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao buscar tendências:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { metric_name, value, metadata } = body

    if (!metric_name || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: metric_name, value' },
        { status: 400 }
      )
    }

    const connection = await getConnection()

    // Inserir novo ponto de tendência
    await connection.execute(`
      INSERT INTO trend_data (metric_name, value, metadata)
      VALUES (?, ?, ?)
    `, [metric_name, value, JSON.stringify(metadata || {})])

    await connection.end()

    return NextResponse.json({
      success: true,
      message: 'Ponto de tendência adicionado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao adicionar tendência:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}