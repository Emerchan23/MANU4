import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../../../lib/database.js'
import multer from 'multer'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

// Configuração do multer para upload em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use PNG, JPEG, JPG ou SVG.'))
    }
  }
})

// GET /api/pdf/logo - Buscar logos disponíveis
export async function GET(request: NextRequest) {
  try {
    const logos = await query(
      'SELECT * FROM logo_uploads WHERE is_active = TRUE ORDER BY uploaded_at DESC'
    )
    
    // Se há logos, retornar o primeiro (mais recente)
    const currentLogo = logos.length > 0 ? logos[0] : null
    
    return NextResponse.json({
      success: true,
      logo: currentLogo,
      logos
    })
  } catch (error) {
    console.error('Erro ao buscar logos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/pdf/logo - Upload de logo
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('logo') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo de logo é obrigatório' },
        { status: 400 }
      )
    }
    
    // Validar tipo de arquivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use PNG, JPEG, JPG ou SVG.' },
        { status: 400 }
      )
    }
    
    // Validar tamanho
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 2MB' },
        { status: 400 }
      )
    }
    
    const buffer = Buffer.from(await file.arrayBuffer())
    const originalName = file.name
    const fileExtension = path.extname(originalName)
    const fileName = `logo_${Date.now()}${fileExtension}`
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'logos')
    const filePath = path.join(uploadsDir, fileName)
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    
    // Processar imagem (exceto SVG)
    if (file.type !== 'image/svg+xml') {
      try {
        // Redimensionar e otimizar imagem
        const processedBuffer = await sharp(buffer)
          .resize(200, 80, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .png({ quality: 90 })
          .toBuffer()
        
        fs.writeFileSync(filePath, processedBuffer)
      } catch (sharpError) {
        console.error('Erro ao processar imagem:', sharpError)
        // Se falhar, salvar arquivo original
        fs.writeFileSync(filePath, buffer)
      }
    } else {
      // Para SVG, salvar diretamente
      fs.writeFileSync(filePath, buffer)
    }
    
    // Salvar informações no banco
    const result = await query(
      `INSERT INTO logo_uploads (original_name, file_name, file_path, mime_type, file_size)
       VALUES (?, ?, ?, ?, ?)`,
      [
        originalName,
        fileName,
        `/uploads/logos/${fileName}`,
        file.type,
        file.size
      ]
    )
    
    return NextResponse.json({
      success: true,
      message: 'Logo enviado com sucesso',
      logo: {
        id: result.insertId,
        originalName,
        fileName,
        filePath: `/uploads/logos/${fileName}`,
        mimeType: file.type,
        fileSize: file.size
      }
    })
  } catch (error) {
    console.error('Erro ao fazer upload do logo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/pdf/logo - Deletar logo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do logo é obrigatório' },
        { status: 400 }
      )
    }
    
    // Buscar informações do logo
    const logo = await query('SELECT * FROM logo_uploads WHERE id = ?', [id])
    if (!logo.length) {
      return NextResponse.json(
        { error: 'Logo não encontrado' },
        { status: 404 }
      )
    }
    
    // Remover arquivo físico
    const filePath = path.join(process.cwd(), 'public', logo[0].file_path)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    
    // Soft delete no banco
    await query('UPDATE logo_uploads SET is_active = FALSE WHERE id = ?', [id])
    
    return NextResponse.json({
      success: true,
      message: 'Logo removido com sucesso'
    })
  } catch (error) {
    console.error('Erro ao deletar logo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}