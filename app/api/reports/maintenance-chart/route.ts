import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database.js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') || '30'
    const sectorId = searchParams.get('sectorId') || 'ALL'
    
    console.log('📈 MAINTENANCE CHART API - Buscando dados do gráfico...')
    console.log('📅 Período:', dateRange, 'dias')
    console.log('🏢 Setor:', sectorId)

    // Calcular data de início baseada no período
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(dateRange))
    const startDateStr = startDate.toISOString().split('T')[0]

    // Query base para filtros
    const sectorFilter = sectorId !== 'ALL' ? 'AND e.sector_id = ?' : ''
    const sectorParams = sectorId !== 'ALL' ? [sectorId] : []

    // Query para dados do gráfico de manutenções
    const maintenanceChartQuery = `
      SELECT 
        DATE(so.requested_date) as date,
        'CORRETIVA' as type,
        COUNT(*) as count
      FROM service_orders so
      JOIN equipment e ON so.equipment_id = e.id
      WHERE so.requested_date >= ? ${sectorFilter}
      GROUP BY DATE(so.requested_date)
      ORDER BY date DESC
      LIMIT 100
    `

    const maintenanceChartResult = await query(maintenanceChartQuery, [startDateStr, ...sectorParams])

    // Processar dados para o formato do gráfico
    const processedData = (maintenanceChartResult as any[]).map(row => ({
      date: new Date(row.date).toLocaleDateString('pt-BR'),
      type: row.type || 'CORRETIVA',
      count: parseInt(row.count) || 0
    }))

    // Agrupar por data e somar os tipos
    const groupedData: { [key: string]: any } = {}
    
    processedData.forEach(item => {
      if (!groupedData[item.date]) {
        groupedData[item.date] = {
          date: item.date,
          PREVENTIVA: 0,
          CORRETIVA: 0,
          CALIBRACAO: 0,
          INSTALACAO: 0
        }
      }
      
      const type = item.type.toUpperCase()
      if (['PREVENTIVA', 'CORRETIVA', 'CALIBRACAO', 'INSTALACAO'].includes(type)) {
        groupedData[item.date][type] = item.count
      } else {
        groupedData[item.date]['CORRETIVA'] += item.count
      }
    })

    // Converter para array e ordenar por data
    const chartData = Object.values(groupedData).sort((a: any, b: any) => {
      const dateA = new Date(a.date.split('/').reverse().join('-'))
      const dateB = new Date(b.date.split('/').reverse().join('-'))
      return dateA.getTime() - dateB.getTime()
    })

    // Estatísticas adicionais
    const totalMaintenances = processedData.reduce((sum, item) => sum + item.count, 0)
    const maintenancesByType = processedData.reduce((acc: any, item) => {
      const type = item.type.toUpperCase()
      acc[type] = (acc[type] || 0) + item.count
      return acc
    }, {})

    const response = {
      data: chartData,
      summary: {
        totalMaintenances,
        maintenancesByType,
        period: `${dateRange} dias`,
        sector: sectorId === 'ALL' ? 'Todos os setores' : `Setor ${sectorId}`
      }
    }

    console.log('✅ MAINTENANCE CHART API - Dados processados com sucesso')
    console.log('📊 Total de manutenções:', totalMaintenances)
    console.log('📈 Pontos no gráfico:', chartData.length)
    console.log('🔧 Por tipo:', maintenancesByType)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ MAINTENANCE CHART API - Erro:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}