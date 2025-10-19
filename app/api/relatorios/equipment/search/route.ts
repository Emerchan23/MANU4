import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('q')

    if (!searchQuery || searchQuery.length < 2) {
      return NextResponse.json([])
    }

    const rows = await query(`
      SELECT 
        e.id,
        e.name,
        e.serial_number,
        e.model,
        e.manufacturer,
        s.nome as sector_name
      FROM equipment e
      LEFT JOIN setores s ON e.sector_id = s.id
      WHERE e.name LIKE ? 
         OR e.serial_number LIKE ?
         OR e.manufacturer LIKE ?
         OR e.model LIKE ?
      ORDER BY e.name
      LIMIT 10
    `, [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`])

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Erro ao buscar equipamentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}