import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const equipmentId = parseInt(params.id)

    if (isNaN(equipmentId)) {
      return NextResponse.json(
        { error: 'ID do equipamento inválido' },
        { status: 400 }
      )
    }

    // Extrair parâmetros de período da URL
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306')
    })
    
    // Buscar histórico de manutenções do equipamento (service_orders)
    try {
      let query = `
        SELECT 
          so.id,
          COALESCE(so.scheduled_date, so.created_at) as date,
          COALESCE(so.type, 'Manutenção') as type,
          COALESCE(so.description, 'Sem descrição') as description,
          so.status,
          COALESCE(u.name, 'Não atribuído') as technician_name,
          COALESCE(so.cost, so.estimated_cost, 0) as cost,
          'Ordem de Serviço' as source_type
        FROM service_orders so
        LEFT JOIN users u ON so.assigned_to = u.id
        WHERE so.equipment_id = ?`

      const queryParams = [equipmentId]

      // Adicionar filtros de período se fornecidos
      if (startDate && endDate) {
        query += ` AND DATE(COALESCE(so.scheduled_date, so.created_at)) BETWEEN ? AND ?`
        queryParams.push(startDate, endDate)
      } else if (startDate) {
        query += ` AND DATE(COALESCE(so.scheduled_date, so.created_at)) >= ?`
        queryParams.push(startDate)
      } else if (endDate) {
        query += ` AND DATE(COALESCE(so.scheduled_date, so.created_at)) <= ?`
        queryParams.push(endDate)
      }

      query += ` ORDER BY COALESCE(so.scheduled_date, so.created_at) DESC`

      // Limitar resultados apenas se não houver filtro de período
      if (!startDate && !endDate) {
        query += ` LIMIT 20`
      }

      console.log('🔍 [RELATÓRIOS] Query de histórico:', query)
      console.log('🔍 [RELATÓRIOS] Parâmetros:', queryParams)

      const [rows] = await connection.execute(query, queryParams)

      await connection.end()
      
      console.log('📊 [RELATÓRIOS] Registros encontrados:', (rows as any[]).length)
      return NextResponse.json(rows || [])
    } catch (queryError) {
      console.error('Erro na query de histórico:', queryError)
      await connection.end()
      return NextResponse.json([])
    }
  } catch (error) {
    console.error('Erro ao buscar histórico do equipamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}