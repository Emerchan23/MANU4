import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/database'
import type { DatabaseResult } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sectorId = searchParams.get('sectorId')
    
    let subsectorsQuery = `
      SELECT s.id, s.nome as name, s.descricao as description, s.setor_id as sector_id, sec.nome as sector_name
      FROM subsetores s
      LEFT JOIN setores sec ON s.setor_id = sec.id
    `
    const queryParams: any[] = []
    
    if (sectorId) {
      subsectorsQuery += ' WHERE s.setor_id = ?'
      queryParams.push(sectorId)
    }
    
    subsectorsQuery += ' ORDER BY s.nome'
    
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
      INSERT INTO subsetores (nome, descricao, setor_id) 
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
      UPDATE subsetores 
      SET nome = ?, descricao = ?, setor_id = ?
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
    
    await execute('DELETE FROM subsetores WHERE id = ?', [id])
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar subsetor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}