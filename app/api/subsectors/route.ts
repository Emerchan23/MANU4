import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/database'
import type { DatabaseResult } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sectorId = searchParams.get('sectorId')
    
    let subsectorsQuery = `
      SELECT s.id, s.name, s.description, s.sector_id, sec.name as sector_name
      FROM subsectors s
      LEFT JOIN sectors sec ON s.sector_id = sec.id
    `
    const queryParams: any[] = []
    
    if (sectorId) {
      subsectorsQuery += ' WHERE s.sector_id = ?'
      queryParams.push(sectorId)
    }
    
    subsectorsQuery += ' ORDER BY s.name'
    
    const subsectors = await query(subsectorsQuery, queryParams) as any[]
    
    return NextResponse.json(subsectors)
  } catch (error) {
    console.error('Erro ao buscar subsetores:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, sector_id } = await request.json()
    
    if (!name || !sector_id) {
      return NextResponse.json(
        { error: 'Nome e setor são obrigatórios' },
        { status: 400 }
      )
    }
    
    const result = await execute(`
      INSERT INTO subsectors (name, description, sector_id) 
      VALUES (?, ?, ?)
    `, [name, description || null, sector_id])
    
    const newSubsector = {
      id: result.insertId.toString(),
      name,
      description,
      sector_id
    }
    
    return NextResponse.json(newSubsector, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar subsetor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, description, sector_id } = await request.json()
    
    if (!id || !name || !sector_id) {
      return NextResponse.json(
        { error: 'ID, nome e setor são obrigatórios' },
        { status: 400 }
      )
    }
    
    await execute(`
      UPDATE subsectors 
      SET name = ?, description = ?, sector_id = ?
      WHERE id = ?
    `, [name, description || null, sector_id, id])
    
    const updatedSubsector = {
      id,
      name,
      description,
      sector_id
    }
    
    return NextResponse.json(updatedSubsector)
  } catch (error) {
    console.error('Erro ao atualizar subsetor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do subsetor é obrigatório' },
        { status: 400 }
      )
    }
    
    await execute('DELETE FROM subsectors WHERE id = ?', [id])
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar subsetor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}