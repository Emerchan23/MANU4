import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
const PDFDocument = require('pdfkit')

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance',
  connectTimeout: 5000,
  acquireTimeout: 5000,
  timeout: 5000,
  charset: 'utf8mb4'
}

// Função para obter texto do status
function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'active': 'Ativo',
    'inactive': 'Inativo',
    'maintenance': 'Em Manutencao',
    'repair': 'Em Reparo',
    'out_of_service': 'Fora de Servico'
  }
  return statusMap[status] || status || 'N/A'
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection: mysql.Connection | null = null

  try {
    const equipmentId = parseInt(params.id)
    
    if (isNaN(equipmentId)) {
      return NextResponse.json({ error: 'ID do equipamento invalido' }, { status: 400 })
    }

    console.log(`📊 PDF PDFKIT: Gerando relatorio para equipamento ID: ${equipmentId}`)

    // Conectar ao banco de dados
    connection = await mysql.createConnection(dbConfig)

    // Buscar dados básicos do equipamento
    const [equipmentRows] = await connection.execute(
      'SELECT id, name, model, serial_number, manufacturer, status FROM equipment WHERE id = ? LIMIT 1',
      [equipmentId]
    )

    const equipment = Array.isArray(equipmentRows) && equipmentRows.length > 0 
      ? equipmentRows[0] as any 
      : null

    if (!equipment) {
      return NextResponse.json({ error: 'Equipamento nao encontrado' }, { status: 404 })
    }

    // Buscar TODAS as manutenções do equipamento com informações completas
    const [maintenanceRows] = await connection.execute(
      `SELECT 
        so.id,
        so.order_number,
        so.type as maintenance_type,
        so.description,
        so.priority,
        so.status,
        so.estimated_cost,
        so.actual_cost,
        so.scheduled_date,
        so.completion_date,
        so.observations,
        so.created_at,
        so.updated_at,
        u1.name as created_by_name,
        u2.name as assigned_to_name,
        c.name as company_name
      FROM service_orders so
      LEFT JOIN users u1 ON so.created_by = u1.id
      LEFT JOIN users u2 ON so.assigned_to = u2.id
      LEFT JOIN companies c ON so.company_id = c.id
      WHERE so.equipment_id = ? 
      ORDER BY so.created_at DESC`,
      [equipmentId]
    )

    const maintenances = Array.isArray(maintenanceRows) ? maintenanceRows : []

    // Criar PDF usando PDFKit
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Relatorio de Equipamento ${equipmentId}`,
        Author: 'Sistema de Manutencao',
        Subject: 'Relatorio de Equipamento',
        Creator: 'Sistema de Manutencao v1.0'
      }
    })

    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks)
        console.log(`✅ PDF PDFKit gerado: ${pdfBuffer.length} bytes`)
        resolve(pdfBuffer)
      })
      doc.on('error', (error) => {
        console.error('❌ Erro no PDFKit:', error)
        reject(error)
      })
    })

    // Cabeçalho
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('RELATORIO DE EQUIPAMENTO', { align: 'center' })
       .moveDown()

    // Linha separadora
    doc.moveTo(50, doc.y)
       .lineTo(545, doc.y)
       .stroke()
       .moveDown()

    // Informações do equipamento
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('DADOS DO EQUIPAMENTO:')
       .moveDown(0.5)

    doc.fontSize(12)
       .font('Helvetica')

    // Sanitizar dados para evitar caracteres problemáticos
    const equipmentName = (equipment.name || 'N/A').replace(/[^\w\s-]/g, ' ')
    const equipmentModel = (equipment.model || 'N/A').replace(/[^\w\s-]/g, ' ')
    const equipmentSerial = (equipment.serial_number || 'N/A').replace(/[^\w\s-]/g, ' ')
    const equipmentManufacturer = (equipment.manufacturer || 'N/A').replace(/[^\w\s-]/g, ' ')

    doc.text(`ID: ${equipment.id}`)
       .text(`Nome: ${equipmentName}`)
       .text(`Modelo: ${equipmentModel}`)
       .text(`Numero de Serie: ${equipmentSerial}`)
       .text(`Fabricante: ${equipmentManufacturer}`)
       .text(`Status: ${getStatusText(equipment.status)}`)
       .moveDown()

    // Histórico de manutenções
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('HISTORICO DE MANUTENCOES:')
       .moveDown(0.5)

    doc.fontSize(11)
       .font('Helvetica')

    if (maintenances.length > 0) {
      maintenances.forEach((maintenance: any, index: number) => {
        // Sanitizar dados
        const orderNumber = (maintenance.order_number || 'N/A').replace(/[^\w\s-]/g, ' ')
        const maintenanceType = (maintenance.maintenance_type || 'N/A').replace(/[^\w\s-]/g, ' ')
        const description = (maintenance.description || 'Sem descricao').replace(/[^\w\s-]/g, ' ')
        const priority = (maintenance.priority || 'N/A').replace(/[^\w\s-]/g, ' ')
        const status = (maintenance.status || 'N/A').replace(/[^\w\s-]/g, ' ')
        const companyName = (maintenance.company_name || 'N/A').replace(/[^\w\s-]/g, ' ')
        const createdByName = (maintenance.created_by_name || 'N/A').replace(/[^\w\s-]/g, ' ')
        const assignedToName = (maintenance.assigned_to_name || 'N/A').replace(/[^\w\s-]/g, ' ')
        const observations = (maintenance.observations || 'Nenhuma observacao').replace(/[^\w\s-]/g, ' ')
        
        // Formatação de datas
        const createdDate = maintenance.created_at ? new Date(maintenance.created_at).toLocaleDateString('pt-BR') : 'N/A'
        const scheduledDate = maintenance.scheduled_date ? new Date(maintenance.scheduled_date).toLocaleDateString('pt-BR') : 'N/A'
        const completionDate = maintenance.completion_date ? new Date(maintenance.completion_date).toLocaleDateString('pt-BR') : 'N/A'
        
        // Formatação de custos
        const estimatedCost = maintenance.estimated_cost ? `R$ ${parseFloat(maintenance.estimated_cost).toFixed(2)}` : 'N/A'
        const actualCost = maintenance.actual_cost ? `R$ ${parseFloat(maintenance.actual_cost).toFixed(2)}` : 'N/A'
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(`${index + 1}. ORDEM DE SERVICO: ${orderNumber}`)
           .moveDown(0.3)
        
        doc.fontSize(10)
           .font('Helvetica')
           .text(`   ID: ${maintenance.id}`)
           .text(`   Tipo: ${maintenanceType}`)
           .text(`   Descricao: ${description}`)
           .text(`   Prioridade: ${priority}`)
           .text(`   Status: ${status}`)
           .text(`   Empresa: ${companyName}`)
           .text(`   Criado por: ${createdByName}`)
           .text(`   Responsavel: ${assignedToName}`)
           .text(`   Data de Criacao: ${createdDate}`)
           .text(`   Data Agendada: ${scheduledDate}`)
           .text(`   Data de Conclusao: ${completionDate}`)
           .text(`   Custo Estimado: ${estimatedCost}`)
           .text(`   Custo Real: ${actualCost}`)
           .text(`   Observacoes: ${observations}`)
           .moveDown(0.8)
      })
    } else {
      doc.text('Nenhuma manutencao encontrada no historico.')
    }

    doc.moveDown()

    // Informações adicionais
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('INFORMACOES ADICIONAIS:')
       .moveDown(0.5)

    doc.fontSize(10)
       .font('Helvetica')
       .text('- Este relatorio foi gerado automaticamente pelo sistema')
       .text('- Para mais informacoes, consulte o sistema de manutencao')
       .text('- Mantenha este documento para seus registros')
       .moveDown()

    // Rodapé
    doc.fontSize(8)
       .text(`Relatorio gerado em: ${new Date().toLocaleString('pt-BR')}`, 50, 750)
       .text('Sistema de Manutencao - Versao 1.0', 50, 765)

    // Finalizar o documento
    doc.end()

    // Aguardar a geração do PDF
    const pdfBuffer = await pdfPromise

    // Validar tamanho mínimo
    if (pdfBuffer.length < 1000) {
      throw new Error('PDF gerado muito pequeno, possivel corrupcao')
    }

    // Retornar PDF para download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-equipamento-${equipmentId}-pdfkit.pdf"`,
        'Cache-Control': 'no-cache',
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('❌ Erro ao gerar relatorio PDF com PDFKit:', error)
    
    return NextResponse.json({ 
      error: 'Erro ao gerar relatorio PDF',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      equipmentId: parseInt(params.id)
    }, { status: 500 })

  } finally {
    if (connection) {
      try {
        await connection.end()
      } catch (e) {
        console.error('Erro ao fechar conexao:', e)
      }
    }
  }
}