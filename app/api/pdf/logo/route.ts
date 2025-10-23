import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../../../lib/database.js'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// GET /api/pdf/logo - Buscar logo atual
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Buscando logo ativo...')
    const logo = await query(
      'SELECT * FROM company_logos WHERE is_active = 1 ORDER BY id DESC LIMIT 1'
    )
    
    console.log('📋 Logo encontrado:', logo[0] || 'Nenhum logo ativo')
    
    return NextResponse.json({
      success: true,
      logo: logo[0] || null
    })
  } catch (error) {
    console.error('❌ Erro ao buscar logo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/pdf/logo - Upload de logo
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando upload de logo...')
    
    const formData = await request.formData()
    const file = formData.get('logo') as File
    
    console.log('📁 Arquivo recebido:', {
      name: file?.name,
      type: file?.type,
      size: file?.size
    })
    
    if (!file) {
      console.error('❌ Nenhum arquivo enviado')
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }
    
    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    console.log('🔍 Validando tipo de arquivo:', file.type, 'permitidos:', allowedTypes)
    
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ Tipo de arquivo não permitido:', file.type)
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use JPG, PNG, GIF, WebP ou SVG.' },
        { status: 400 }
      )
    }
    
    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ Arquivo muito grande:', file.size, 'bytes')
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 5MB.' },
        { status: 400 }
      )
    }
    
    // Criar diretório se não existir
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'logos')
    console.log('📂 Diretório de upload:', uploadDir)
    
    if (!existsSync(uploadDir)) {
      console.log('📁 Criando diretório de uploads...')
      await mkdir(uploadDir, { recursive: true })
      console.log('✅ Diretório criado com sucesso')
    } else {
      console.log('✅ Diretório já existe')
    }
    
    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const fileName = `logo_${timestamp}.${extension}`
    const filePath = join(uploadDir, fileName)
    
    console.log('💾 Salvando arquivo:', fileName, 'em:', filePath)
    
    // Salvar arquivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    console.log('✅ Arquivo salvo no sistema de arquivos')
    
    // Desativar logos anteriores
    console.log('🔄 Desativando logos anteriores...')
    await query('UPDATE company_logos SET is_active = 0 WHERE is_active = 1')
    console.log('✅ Logos anteriores desativados')
    
    // Salvar informações no banco
    const logoData = {
      original_name: file.name,
      filename: fileName,
      file_path: `/uploads/logos/${fileName}`,
      mime_type: file.type,
      file_size: file.size,
      is_active: 1
    }
    
    console.log('💾 Salvando no banco MariaDB:', logoData)
    
    await query(
      `INSERT INTO company_logos (original_name, filename, file_path, mime_type, file_size, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [logoData.original_name, logoData.filename, logoData.file_path, logoData.mime_type, logoData.file_size, logoData.is_active]
    )
    
    console.log('✅ Logo salvo no banco de dados')
    
    // Buscar logo recém-criado
    const newLogo = await query(
      'SELECT * FROM company_logos WHERE is_active = 1 ORDER BY id DESC LIMIT 1'
    )
    
    console.log('🎉 Upload concluído com sucesso:', newLogo[0])
    
    return NextResponse.json({
      success: true,
      message: 'Logo enviado com sucesso',
      logo: newLogo[0]
    })
  } catch (error) {
    console.error('Erro ao fazer upload do logo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/pdf/logo - Remover logo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const logoId = searchParams.get('id')
    
    if (!logoId) {
      return NextResponse.json(
        { error: 'ID do logo é obrigatório' },
        { status: 400 }
      )
    }
    
    // Desativar logo
    await query('UPDATE company_logos SET is_active = FALSE WHERE id = ?', [logoId])
    
    return NextResponse.json({
      success: true,
      message: 'Logo removido com sucesso'
    })
  } catch (error) {
    console.error('Erro ao remover logo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}