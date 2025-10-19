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
        c.id,
        c.name,
        c.cnpj,
        c.email
      FROM companies c
      WHERE c.name LIKE ? 
         OR c.cnpj LIKE ?
         OR c.email LIKE ?
      ORDER BY c.name
      LIMIT 10
    `, [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`])

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Erro ao buscar empresas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}