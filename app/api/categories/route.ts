import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/database'
import type { DatabaseResult } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [API] Buscando categorias...')
    
    const categories = await query(
      'SELECT id, name, is_electrical as isElectrical, description FROM categories ORDER BY name'
    ) as any[]
    
    console.log('✅ [API] Categorias encontradas:', (categories as any[]).length)
    console.log('📊 [API] Dados das categorias:', categories)
    
    return NextResponse.json(categories)
  } catch (error) {
    console.error('❌ [API] Erro ao buscar categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, isElectrical, description } = await request.json()
    
    if (!name) {
      return NextResponse.json(
        { error: 'Nome da categoria é obrigatório' },
        { status: 400 }
      )
    }
    
    const result = await execute(
      'INSERT INTO categories (name, is_electrical, description) VALUES (?, ?, ?)',
      [name, isElectrical || false, description || null]
    )
    
    const newCategory = {
      id: result.insertId.toString(),
      name,
      isElectrical: isElectrical || false,
      description: description || null
    }
    
    console.log('✅ Categoria criada:', newCategory)
    return NextResponse.json(newCategory, { status: 201 })
    
  } catch (error) {
    console.error('❌ Erro ao criar categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, isElectrical, description } = await request.json()
    
    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID e nome são obrigatórios' },
        { status: 400 }
      )
    }
    
    const result = await execute(
      'UPDATE categories SET name = ?, is_electrical = ?, description = ? WHERE id = ?',
      [name, isElectrical || false, description || null, id]
    )
    
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }
    
    const updatedCategory = {
      id,
      name,
      isElectrical: isElectrical || false,
      description: description || null
    }
    
    console.log('✅ Categoria atualizada:', updatedCategory)
    return NextResponse.json(updatedCategory)
    
  } catch (error) {
    console.error('❌ Erro ao atualizar categoria:', error)
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
        { error: 'ID da categoria é obrigatório' },
        { status: 400 }
      )
    }
    
    const result = await execute('DELETE FROM categories WHERE id = ?', [id])
    
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }
    
    console.log('✅ Categoria excluída:', id)
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('❌ Erro ao excluir categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}