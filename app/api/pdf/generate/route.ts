import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../../../lib/database.js'
import { PDFGenerator } from '../../../../lib/pdf-generator'
import fs from 'fs'
import path from 'path'

// POST /api/pdf/generate - Gerar PDF
export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando geração de PDF...')

    const body = await request.json()
    const { type, data, options = {} } = body

    console.log('Dados recebidos:', { type, data: JSON.stringify(data).substring(0, 200) + '...' })

    if (!type || !data) {
      console.log('Erro: Tipo ou dados não fornecidos')
      return NextResponse.json(
        { error: 'Tipo e dados são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('Criando instância do PDFGenerator...')
    const generator = new PDFGenerator()
    let pdfBuffer: Uint8Array
    let fileName: string

    switch (type) {
      case 'reports':
        console.log('Gerando PDF de relatório...')
        pdfBuffer = await generator.generateReportPDF(data)
        fileName = `relatorio_${data.reportType || 'geral'}_${Date.now()}.pdf`
        break

      case 'service-order':
      case 'service_order':
        console.log('Gerando PDF de ordem de serviço...')
        pdfBuffer = await generator.generateServiceOrderPDF(data)
        fileName = `ordem_servico_${data.order_number || 'sem_numero'}_${Date.now()}.pdf`
        break

      case 'service_orders':
        console.log('Gerando PDF de relatório de ordens de serviço...')
        pdfBuffer = await generator.generateReportPDF(data)
        fileName = `relatorio_ordens_servico_${Date.now()}.pdf`
        break

      case 'preventive-maintenance':
        console.log('Gerando PDF de manutenção preventiva...')
        pdfBuffer = await generator.generateReportPDF({
          title: 'Relatório de Manutenção Preventiva',
          subtitle: data.subtitle,
          data: data.maintenances || [],
          summary: data.summary,
          filters: data.filters
        })
        fileName = `manutencao_preventiva_${Date.now()}.pdf`
        break

      case 'preventive_maintenance':
        console.log('Gerando PDF de manutenção preventiva individual...')
        pdfBuffer = await generator.generatePreventiveMaintenancePDF(data)
        fileName = `ordem_servico_manutencao_preventiva_${data.id || Date.now()}.pdf`
        break

      case 'maintenance-schedule':
      case 'maintenance_schedule':
        console.log('Gerando PDF de agendamento de manutenção...')
        pdfBuffer = await generator.generateMaintenanceSchedulePDF(data)
        fileName = `agendamento_manutencao_${data.id || Date.now()}.pdf`
        break

      case 'preview':
        console.log('Gerando PDF de preview com configurações personalizadas...')
        pdfBuffer = await generator.generatePreviewPDF(data)
        fileName = `preview_pdf_${Date.now()}.pdf`
        break

      default:
        console.log('Erro: Tipo de PDF não suportado:', type)
        return NextResponse.json(
          { error: 'Tipo de PDF não suportado' },
          { status: 400 }
        )
    }

    console.log('PDF gerado, tamanho:', pdfBuffer.length, 'bytes')

    // Salvar arquivo no servidor
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'pdf-exports')
    console.log('Diretório de uploads:', uploadsDir)

    if (!fs.existsSync(uploadsDir)) {
      console.log('Criando diretório de uploads...')
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const filePath = path.join(uploadsDir, fileName)
    console.log('Salvando arquivo em:', filePath)
    fs.writeFileSync(filePath, pdfBuffer)

    // Registrar exportação no banco
    console.log('Registrando exportação no banco de dados...')
    await query(
      `INSERT INTO pdf_exports (document_type, file_path, file_size, export_params, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        type,
        `/uploads/pdf-exports/${fileName}`,
        pdfBuffer.length,
        JSON.stringify({
          originalData: data,
          options,
          fileName,
          generatedAt: new Date().toISOString()
        }),
        'completed'
      ]
    )

    // Retornar URL para download
    const downloadUrl = `/uploads/pdf-exports/${fileName}`
    console.log('PDF gerado com sucesso, URL:', downloadUrl)

    return NextResponse.json({
      success: true,
      message: 'PDF gerado com sucesso',
      fileName,
      downloadUrl,
      fileSize: pdfBuffer.length
    })

  } catch (error) {
    console.error('Erro detalhado ao gerar PDF:', error)
    console.error('Stack trace:', error.stack)
    return NextResponse.json(
      { error: `Erro interno do servidor ao gerar PDF: ${error.message}` },
      { status: 500 }
    )
  }
}

// GET /api/pdf/generate - Listar PDFs gerados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '10')

    let sql = 'SELECT * FROM pdf_exports WHERE 1=1'
    const params: any[] = []

    if (type) {
      sql += ' AND export_type = ?'
      params.push(type)
    }

    sql += ' ORDER BY created_at DESC LIMIT ?'
    params.push(limit)

    const exports = await query(sql, params)

    return NextResponse.json({
      success: true,
      exports
    })
  } catch (error) {
    console.error('Erro ao buscar PDFs:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}