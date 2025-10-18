import { NextRequest, NextResponse } from 'next/server'
import { getConnection } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'maintenance_frequency'
    const period = searchParams.get('period') || '30d'

    const connection = await getConnection()
    
    let heatmapData = []
    
    switch (type) {
      case 'maintenance_frequency':
        // Mapa de calor de frequência de manutenção por setor/equipamento
        const [maintenanceHeatmap] = await connection.execute(`
          SELECT 
            e.setor as x_axis,
            e.tipo as y_axis,
            COUNT(os.id) as value,
            AVG(CASE WHEN os.status = 'Concluída' THEN 1 ELSE 0 END) * 100 as completion_rate
          FROM equipamentos e
          LEFT JOIN ordens_servico os ON e.id = os.equipamento_id
          WHERE os.data_abertura >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY e.setor, e.tipo
          HAVING COUNT(os.id) > 0
          ORDER BY value DESC
        `)
        heatmapData = maintenanceHeatmap
        break

      case 'equipment_utilization':
        // Mapa de calor de utilização de equipamentos
        const [utilizationHeatmap] = await connection.execute(`
          SELECT 
            DATE(h.recorded_at) as x_axis,
            h.equipment_type as y_axis,
            AVG(h.value) as value,
            COUNT(*) as data_points
          FROM heatmap_data h
          WHERE h.metric_type = 'utilization'
          AND h.recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY DATE(h.recorded_at), h.equipment_type
          ORDER BY h.recorded_at DESC, value DESC
        `)
        heatmapData = utilizationHeatmap
        break

      case 'failure_patterns':
        // Mapa de calor de padrões de falha
        const [failureHeatmap] = await connection.execute(`
          SELECT 
            HOUR(os.data_abertura) as x_axis,
            DAYNAME(os.data_abertura) as y_axis,
            COUNT(*) as value,
            AVG(CASE WHEN os.prioridade = 'Alta' THEN 3 
                     WHEN os.prioridade = 'Média' THEN 2 
                     ELSE 1 END) as avg_priority
          FROM ordens_servico os
          WHERE os.data_abertura >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          AND os.tipo = 'Corretiva'
          GROUP BY HOUR(os.data_abertura), DAYNAME(os.data_abertura)
          ORDER BY value DESC
        `)
        heatmapData = failureHeatmap
        break

      case 'cost_analysis':
        // Mapa de calor de análise de custos
        const [costHeatmap] = await connection.execute(`
          SELECT 
            e.setor as x_axis,
            MONTH(os.data_abertura) as y_axis,
            SUM(COALESCE(os.custo_total, 0)) as value,
            COUNT(os.id) as order_count
          FROM equipamentos e
          JOIN ordens_servico os ON e.id = os.equipamento_id
          WHERE os.data_abertura >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
          GROUP BY e.setor, MONTH(os.data_abertura)
          ORDER BY value DESC
        `)
        heatmapData = costHeatmap
        break

      default:
        // Dados genéricos do heatmap_data
        const [genericHeatmap] = await connection.execute(`
          SELECT 
            x_coordinate as x_axis,
            y_coordinate as y_axis,
            value,
            JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.category')) as category
          FROM heatmap_data
          WHERE recorded_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          ORDER BY recorded_at DESC, value DESC
          LIMIT 100
        `)
        heatmapData = genericHeatmap
    }

    // Calcular estatísticas do heatmap
    const values = heatmapData.map((item: any) => parseFloat(item.value) || 0)
    const stats = {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      count: values.length
    }

    // Obter tipos disponíveis
    const [availableTypes] = await connection.execute(`
      SELECT DISTINCT 
        'maintenance_frequency' as type, 'Frequência de Manutenção' as display_name
      UNION ALL
      SELECT 'equipment_utilization', 'Utilização de Equipamentos'
      UNION ALL
      SELECT 'failure_patterns', 'Padrões de Falha'
      UNION ALL
      SELECT 'cost_analysis', 'Análise de Custos'
    `)

    await connection.end()

    return NextResponse.json({
      success: true,
      data: {
        type,
        period,
        heatmap: heatmapData,
        stats,
        availableTypes
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao buscar heatmap:', error)
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
    const { x_coordinate, y_coordinate, value, equipment_type, metadata } = body

    if (x_coordinate === undefined || y_coordinate === undefined || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: x_coordinate, y_coordinate, value' },
        { status: 400 }
      )
    }

    const connection = await getConnection()

    // Inserir novo ponto no heatmap
    await connection.execute(`
      INSERT INTO heatmap_data (x_coordinate, y_coordinate, value, equipment_type, metadata)
      VALUES (?, ?, ?, ?, ?)
    `, [x_coordinate, y_coordinate, value, equipment_type || null, JSON.stringify(metadata || {})])

    await connection.end()

    return NextResponse.json({
      success: true,
      message: 'Ponto do heatmap adicionado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao adicionar ponto do heatmap:', error)
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