import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Configuração do banco de dados MariaDB
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
  timezone: '+00:00'
}

// POST - Cancelar agendamento de manutenção
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection;
  try {
    const { id } = params
    console.log('🔄 API /api/maintenance-schedules/cancel/[id] - Cancelando agendamento:', id)
    
    // Conectar ao MariaDB
    connection = await mysql.createConnection(dbConfig);
    
    // Verificar se o agendamento existe primeiro
    const [existingSchedule] = await connection.execute(
      'SELECT * FROM maintenance_schedules WHERE id = ?', 
      [id]
    )
    
    if (existingSchedule.length === 0) {
      console.log('❌ Agendamento não encontrado:', id)
      return NextResponse.json(
        { success: false, error: 'Agendamento de manutenção não encontrado' },
        { status: 404 }
      )
    }
    
    console.log('✅ Agendamento encontrado:', existingSchedule[0])
    
    // Ler o body da requisição
    const body = await request.json()
    console.log('📊 Body recebido:', body)
    
    const { status = 'CANCELLED', completion_notes } = body
    
    // Verificar se o agendamento já está cancelado ou concluído
    const currentSchedule = existingSchedule[0]
    if (currentSchedule.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Agendamento já está cancelado' },
        { status: 400 }
      )
    }
    
    if (currentSchedule.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Não é possível cancelar um agendamento já concluído' },
        { status: 400 }
      )
    }
    
    // Executar atualização
    const updateQuery = `
      UPDATE maintenance_schedules 
      SET status = ?, completion_notes = ?, updated_at = NOW()
      WHERE id = ?
    `
    
    console.log('📊 Query de atualização:', updateQuery)
    console.log('📊 Parâmetros:', [status, completion_notes || null, id])
    
    const [result] = await connection.execute(updateQuery, [status, completion_notes || null, id])
    console.log('✅ Resultado da atualização:', result)
    
    if (result.affectedRows === 0) {
      console.log('❌ Nenhuma linha foi afetada')
      return NextResponse.json(
        { success: false, error: 'Nenhuma alteração foi feita' },
        { status: 400 }
      )
    }
    
    // Buscar agendamento atualizado
    const [updatedSchedule] = await connection.execute(
      'SELECT * FROM maintenance_schedules WHERE id = ?', 
      [id]
    )
    console.log('✅ Agendamento atualizado:', updatedSchedule[0])
    
    return NextResponse.json({
      success: true,
      data: updatedSchedule[0],
      message: 'Agendamento cancelado com sucesso'
    })
    
  } catch (error) {
    console.error('❌ Erro ao cancelar agendamento:', error)
    console.error('❌ Stack trace:', error.stack)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor ao cancelar agendamento' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}