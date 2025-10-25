import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

// GET - Equipamentos próximos de manutenção preventiva
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const daysParam = searchParams.get('days')
    const days = Math.max(1, Math.min(60, parseInt(daysParam || '7')))

    const sql = `
      SELECT e.*, s.nome as sector_name,
             DATEDIFF(e.next_preventive_maintenance, CURDATE()) as days_until_maintenance
      FROM equipment e
      LEFT JOIN sectors s ON e.sector_id = s.id
      WHERE e.next_preventive_maintenance IS NOT NULL
        AND e.next_preventive_maintenance BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY e.next_preventive_maintenance ASC
    `

    const rows = await query(sql, [days])

    return NextResponse.json({
      success: true,
      data: rows,
      total: rows.length,
      days
    })
  } catch (error) {
    console.error('❌ API - Equipamentos próximos de manutenção:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar equipamentos' }, { status: 500 })
  }
}