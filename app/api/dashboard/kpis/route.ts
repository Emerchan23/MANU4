import { NextRequest, NextResponse } from 'next/server'
import { getConnection } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const connection = await getConnection()
    
    // Buscar KPIs atuais
    const [kpis] = await connection.execute(`
      SELECT 
        metric_name,
        value,
        unit,
        category,
        JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.description')) as description,
        JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.icon')) as icon,
        JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.color')) as color,
        recorded_at
      FROM kpi_metrics
      WHERE recorded_at = (
        SELECT MAX(recorded_at) 
        FROM kpi_metrics k2 
        WHERE k2.metric_name = kpi_metrics.metric_name
      )
      ORDER BY 
        CASE category 
          WHEN 'critical' THEN 1
          WHEN 'operations' THEN 2
          WHEN 'performance' THEN 3
          WHEN 'inventory' THEN 4
          ELSE 5
        END,
        metric_name
    `)

    // Calcular variações (comparar com período anterior)
    const [variations] = await connection.execute(`
      SELECT 
        k1.metric_name,
        k1.value as current_value,
        k2.value as previous_value,
        ROUND(((k1.value - k2.value) / k2.value) * 100, 2) as variation_percent
      FROM kpi_metrics k1
      LEFT JOIN kpi_metrics k2 ON k1.metric_name = k2.metric_name
      WHERE k1.recorded_at = (
        SELECT MAX(recorded_at) FROM kpi_metrics WHERE metric_name = k1.metric_name
      )
      AND k2.recorded_at = (
        SELECT MAX(recorded_at) 
        FROM kpi_metrics 
        WHERE metric_name = k1.metric_name 
        AND recorded_at < k1.recorded_at
      )
    `)

    // Criar mapa de variações
    const variationMap = new Map()
    variations.forEach((v: any) => {
      variationMap.set(v.metric_name, {
        variation: v.variation_percent || 0,
        trend: v.variation_percent > 0 ? 'up' : v.variation_percent < 0 ? 'down' : 'stable'
      })
    })

    // Enriquecer KPIs com variações
    const enrichedKpis = kpis.map((kpi: any) => ({
      ...kpi,
      variation: variationMap.get(kpi.metric_name)?.variation || 0,
      trend: variationMap.get(kpi.metric_name)?.trend || 'stable'
    }))

    await connection.end()

    return NextResponse.json({
      success: true,
      data: enrichedKpis,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao buscar KPIs:', error)
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
    const { metric_name, value, unit, category, metadata } = body

    if (!metric_name || value === undefined || !category) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: metric_name, value, category' },
        { status: 400 }
      )
    }

    const connection = await getConnection()

    // Inserir nova métrica
    await connection.execute(`
      INSERT INTO kpi_metrics (metric_name, value, unit, category, metadata)
      VALUES (?, ?, ?, ?, ?)
    `, [metric_name, value, unit || null, category, JSON.stringify(metadata || {})])

    await connection.end()

    return NextResponse.json({
      success: true,
      message: 'KPI criado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao criar KPI:', error)
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