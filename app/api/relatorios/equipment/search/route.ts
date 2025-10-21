import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00'
}

export async function GET(request: NextRequest) {
  let connection
  
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('q')
    const sectorId = searchParams.get('sector')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    console.log('Parâmetros de busca:', { searchQuery, sectorId, startDate, endDate })
    
    connection = await mysql.createConnection(dbConfig)
    
    // Construir query base
    let query = `
      SELECT DISTINCT
        e.id,
        e.name,
        e.serial_number as code,
        e.model,
        e.manufacturer,
        COALESCE(s.name, 'Sem setor') as sector_name
      FROM equipment e
      LEFT JOIN sectors s ON e.sector_id = s.id
    `
    
    // Construir condições WHERE
    const conditions = []
    const params = []
    
    // Filtro por texto (se fornecido)
    if (searchQuery && searchQuery.length >= 2) {
      conditions.push(`(
        e.name LIKE ? 
        OR e.serial_number LIKE ?
        OR e.manufacturer LIKE ?
        OR e.model LIKE ?
      )`)
      params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`)
    }
    
    // Filtro por setor (se fornecido)
    if (sectorId && sectorId !== '') {
      conditions.push('e.sector_id = ?')
      params.push(sectorId)
    }
    
    // Se há filtros de data, incluir equipamentos que tiveram manutenções no período
    if (startDate || endDate) {
      let dateCondition = 'EXISTS (SELECT 1 FROM maintenance_schedules ms WHERE ms.equipment_id = e.id'
      
      if (startDate && endDate) {
        dateCondition += ' AND DATE(ms.scheduled_date) BETWEEN ? AND ?'
        params.push(startDate, endDate)
      } else if (startDate) {
        dateCondition += ' AND DATE(ms.scheduled_date) >= ?'
        params.push(startDate)
      } else if (endDate) {
        dateCondition += ' AND DATE(ms.scheduled_date) <= ?'
        params.push(endDate)
      }
      
      dateCondition += ')'
      conditions.push(dateCondition)
    }
    
    // Adicionar condições WHERE se existirem
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }
    
    // Ordenar e limitar resultados
    query += ' ORDER BY e.name LIMIT 50'
    
    console.log('Query final:', query)
    console.log('Parâmetros:', params)

    const [rows] = await connection.execute(query, params)

    console.log('Equipamentos encontrados:', Array.isArray(rows) ? rows.length : 0)

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Erro ao buscar equipamentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}