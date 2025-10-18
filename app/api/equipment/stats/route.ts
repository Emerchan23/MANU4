import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '-03:00'
}

export async function GET(request: NextRequest) {
  let connection: mysql.Connection | null = null
  
  try {
    console.log('🔍 [API] Buscando estatísticas de equipamentos...')
    
    const url = new URL(request.url)
    const equipmentId = url.searchParams.get('equipment_id')
    const sectorId = url.searchParams.get('sector_id')
    const dateRange = url.searchParams.get('date_range') || '30' // dias
    
    connection = await mysql.createConnection(dbConfig)
    
    // Se um equipamento específico foi solicitado (apenas quando equipment_id é fornecido explicitamente)
    if (equipmentId && equipmentId !== 'null' && equipmentId !== '') {
      // Verificar se o equipamento existe
      const [equipmentResult] = await connection.execute(`
        SELECT 
          e.*,
          s.name as sector_name,
          c.name as category_name
        FROM equipamentos e
        LEFT JOIN setores s ON e.sector_id = s.id
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE e.id = ?
      `, [equipmentId])
      
      if (equipmentResult.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'Equipamento não encontrado'
        }, { status: 404 })
      }
      
      const equipment = equipmentResult[0]
      
      // Buscar estatísticas do equipamento
      const [statsResult] = await connection.execute(`
        SELECT 
          COUNT(CASE WHEN so.status = 'aberta' THEN 1 END) as open_orders,
          COUNT(CASE WHEN so.status = 'concluida' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN so.status = 'em_andamento' THEN 1 END) as in_progress_orders,
          COUNT(*) as total_orders,
          AVG(CASE WHEN so.status = 'concluida' AND so.completion_date IS NOT NULL 
              THEN TIMESTAMPDIFF(HOUR, so.created_at, so.completion_date)
              END) as avg_completion_hours,
          MAX(so.created_at) as last_maintenance_date
        FROM ordens_servico so
        WHERE so.equipment_id = ?
          AND so.created_at >= DATE_SUB(NOW(), INTERVAL ${parseInt(dateRange)} DAY)
      `, [equipmentId])
      
      const stats = statsResult[0] || {
        open_orders: 0,
        completed_orders: 0,
        in_progress_orders: 0,
        total_orders: 0,
        avg_completion_hours: 0,
        last_maintenance_date: null
      }
      
      return NextResponse.json({
        success: true,
        data: {
          equipment: {
            id: equipment.id,
            name: equipment.name,
            model: equipment.model,
            serial_number: equipment.serial_number,
            sector_name: equipment.sector_name,
            category_name: equipment.category_name,
            status: equipment.status
          },
          stats: {
            open_orders: parseInt(stats.open_orders) || 0,
            completed_orders: parseInt(stats.completed_orders) || 0,
            in_progress_orders: parseInt(stats.in_progress_orders) || 0,
            total_orders: parseInt(stats.total_orders) || 0,
            avg_completion_hours: parseFloat(stats.avg_completion_hours) || 0,
            last_maintenance_date: stats.last_maintenance_date
          }
        }
      })
    }
    
    // Estatísticas gerais de equipamentos
    let whereClause = ''
    let params = []
    
    if (sectorId) {
      whereClause = 'WHERE e.sector_id = ?'
      params.push(sectorId)
    }
    
    const [generalStatsResult] = await connection.execute(`
      SELECT 
        COUNT(*) as total_equipment,
        COUNT(CASE WHEN e.status = 'ativo' THEN 1 END) as active_equipment,
        COUNT(CASE WHEN e.status = 'inativo' THEN 1 END) as inactive_equipment,
        COUNT(CASE WHEN e.status = 'manutencao' THEN 1 END) as maintenance_equipment,
        COUNT(DISTINCT e.sector_id) as sectors_count,
        COUNT(DISTINCT e.category_id) as categories_count
      FROM equipamentos e
      ${whereClause}
    `, params)
    
    const generalStats = generalStatsResult[0] || {
      total_equipment: 0,
      active_equipment: 0,
      inactive_equipment: 0,
      maintenance_equipment: 0,
      sectors_count: 0,
      categories_count: 0
    }
    
    // Estatísticas de ordens de serviço relacionadas
    const [ordersStatsResult] = await connection.execute(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN so.status = 'aberta' THEN 1 END) as open_orders,
        COUNT(CASE WHEN so.status = 'concluida' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN so.status = 'em_andamento' THEN 1 END) as in_progress_orders
      FROM ordens_servico so
      JOIN equipamentos e ON so.equipment_id = e.id
      ${whereClause}
      AND so.created_at >= DATE_SUB(NOW(), INTERVAL ${parseInt(dateRange)} DAY)
    `, params)
    
    const ordersStats = ordersStatsResult[0] || {
      total_orders: 0,
      open_orders: 0,
      completed_orders: 0,
      in_progress_orders: 0
    }
    
    console.log('✅ [API] Estatísticas de equipamentos calculadas com sucesso')
    
    return NextResponse.json({
      success: true,
      data: {
        equipment: {
          total: parseInt(generalStats.total_equipment) || 0,
          active: parseInt(generalStats.active_equipment) || 0,
          inactive: parseInt(generalStats.inactive_equipment) || 0,
          maintenance: parseInt(generalStats.maintenance_equipment) || 0,
          sectors_count: parseInt(generalStats.sectors_count) || 0,
          categories_count: parseInt(generalStats.categories_count) || 0
        },
        orders: {
          total: parseInt(ordersStats.total_orders) || 0,
          open: parseInt(ordersStats.open_orders) || 0,
          completed: parseInt(ordersStats.completed_orders) || 0,
          in_progress: parseInt(ordersStats.in_progress_orders) || 0
        },
        period: `${dateRange} dias`
      }
    })
    
  } catch (error) {
    console.error('❌ [API] Erro ao buscar estatísticas de equipamentos:', error)
    
    // Se for erro de tabela não existir ou não ter dados, retornar dados vazios
    if (error.message && (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('table') || error.message.includes('doesn\'t exist'))) {
      console.log('⚠️ Tabelas não existem, retornando dados vazios')
      return NextResponse.json({
        success: true,
        data: {
          equipment: {
            total: 0,
            active: 0,
            inactive: 0,
            maintenance: 0,
            sectors_count: 0,
            categories_count: 0
          },
          orders: {
            total: 0,
            open: 0,
            completed: 0,
            in_progress: 0
          },
          period: '30 dias'
        },
        message: 'Dados não disponíveis - tabelas não encontradas'
      })
    }
    
    // Para outros erros, retornar dados vazios também para evitar quebrar o frontend
    return NextResponse.json({
      success: true,
      data: {
        equipment: {
          total: 0,
          active: 0,
          inactive: 0,
          maintenance: 0,
          sectors_count: 0,
          categories_count: 0
        },
        orders: {
          total: 0,
          open: 0,
          completed: 0,
          in_progress: 0
        },
        period: '30 dias'
      },
      message: 'Dados não disponíveis - ' + error.message
    })
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}