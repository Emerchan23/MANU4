import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/database'
import type { DatabaseResult } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const sql = `
      SELECT s.id, s.nome as name, s.descricao as description, s.responsavel as manager_id, s.ativo as active, s.criado_em as created_at, s.atualizado_em as updated_at
      FROM setores s
      WHERE s.ativo = 1
      ORDER BY s.nome
    `
    
    const sectors = await query(sql) as any[]
    return NextResponse.json(sectors)
  } catch (error) {
    console.error('Erro ao buscar setores:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Body completo recebido:', body)
    
    const { name, description, responsible, manager_id } = body
    
    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }
    
    // Aceitar tanto 'responsible' quanto 'manager_id' para compatibilidade
    const managerId = manager_id || responsible || null
    
    console.log('Dados extraídos:', { name, description, responsible, manager_id, managerId })
    console.log('Dados recebidos para criar setor:', { name, description, manager_id: managerId })
    
    const insertQuery = `
      INSERT INTO setores (nome, descricao, responsavel, ativo) 
      VALUES (?, ?, ?, 1)
    `
    
    const result = await execute(insertQuery, [
      name,
      description || null,
      managerId
    ])
    
    console.log('Setor criado com sucesso, ID:', result.insertId)
    
    const newSector = {
      id: result.insertId.toString(),
      name,
      description,
      manager_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    return NextResponse.json(newSector, { status: 201 })
  } catch (error: unknown) {
    console.error('💥 [SECTORS API] Erro ao buscar setores:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('PUT request recebido')
    const body = await request.json()
    console.log('Body parseado:', body)
    
    const { id, name, description, responsible, manager_id } = body
    
    if (!id || !name) {
      console.log('Erro de validação:', { id, name })
      return NextResponse.json(
        { error: 'ID e nome são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Aceitar tanto 'responsible' quanto 'manager_id' para compatibilidade
    const managerId = manager_id || responsible || null
    
    console.log('Dados recebidos para atualizar setor:', { id, name, description, manager_id: managerId })
    
    const updateQuery = `
      UPDATE setores 
      SET nome = ?, descricao = ?, responsavel = ?, atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ? AND ativo = 1
    `
    
    const result = await execute(updateQuery, [
      name,
      description || null,
      managerId,
      id
    ])
    
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Setor não encontrado ou inativo' },
        { status: 404 }
      )
    }
    
    console.log('Setor atualizado com sucesso, ID:', id)
    
    const updatedSector = {
      id,
      name,
      description,
      manager_id,
      updated_at: new Date().toISOString()
    }
    
    return NextResponse.json(updatedSector)
  } catch (error) {
    console.error('Erro ao atualizar setor:', error)
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
    
    console.log('DEBUG Next.js API - URL:', request.url)
    console.log('DEBUG Next.js API - searchParams:', searchParams)
    console.log('DEBUG Next.js API - id:', id)
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      )
    }
    
    console.log('Tentando deletar setor ID:', id)
    
    // Verificar se há subsetores vinculados
    const subsectorsCheck = await query(
      'SELECT COUNT(*) as count FROM subsetores WHERE setor_id = ?',
      [id]
    ) as any[]
    
    if (subsectorsCheck[0].count > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir setor com subsetores ativos' },
        { status: 400 }
      )
    }
    
    // Verificar se há equipamentos vinculados
    const equipmentCheck = await query(
      'SELECT COUNT(*) as count FROM equipment WHERE sector_id = ?',
      [id]
    ) as any[]
    
    if (equipmentCheck[0].count > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir setor com equipamentos vinculados' },
        { status: 400 }
      )
    }
    
    // Delete do setor
    const result = await execute(
      'DELETE FROM setores WHERE id = ?',
      [id]
    )
    
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Setor não encontrado' },
        { status: 404 }
      )
    }
    
    console.log('Setor marcado como inativo com sucesso, ID:', id)
    
    return NextResponse.json({ success: true, message: 'Setor excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar setor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}