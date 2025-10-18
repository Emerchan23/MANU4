import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database.js'
import jsPDF from 'jspdf'

// GET /api/pdf/service-order/[id] - Gerar PDF de ordem de serviço específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    console.log('Gerando PDF para ordem de serviço ID:', id)

    // Buscar dados da ordem de serviço
    const orderQuery = `
      SELECT 
        so.*,
        e.name as equipment_name,
        e.model as equipment_model,
        e.serial_number as equipment_serial,
        e.patrimonio as equipment_patrimonio,
        s.name as sector_name,
        ss.name as subsector_name,
        c.name as company_name,
        c.cnpj as company_cnpj,
        c.contact_phone as company_phone,
        c.address as company_address,
        u1.name as created_by_name,
        u2.name as assigned_to_name,
        mt.name as maintenance_type_name
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN sectors s ON e.sector_id = s.id
      LEFT JOIN subsectors ss ON e.subsector_id = ss.id
      LEFT JOIN empresas c ON so.company_id = c.id
      LEFT JOIN users u1 ON so.created_by = u1.id
      LEFT JOIN users u2 ON so.assigned_to = u2.id
      LEFT JOIN maintenance_types mt ON so.maintenance_type_id = mt.id
      WHERE so.id = ?
    `

    const result = await query(orderQuery, [id])

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      )
    }

    const orderData = result[0]
    console.log('Dados da ordem encontrados:', orderData.order_number)

    // Gerar PDF simples diretamente com jsPDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Adicionar conteúdo básico ao PDF
    pdf.setFontSize(20)
    pdf.text('ORDEM DE SERVIÇO', 20, 30)
    
    pdf.setFontSize(12)
    pdf.text(`Número: ${orderData.order_number || 'N/A'}`, 20, 50)
    pdf.text(`Equipamento: ${orderData.equipment_name || 'N/A'}`, 20, 60)
    pdf.text(`Empresa: ${orderData.company_name || 'N/A'}`, 20, 70)
    pdf.text(`Status: ${orderData.status || 'N/A'}`, 20, 80)
    pdf.text(`Prioridade: ${orderData.priority || 'N/A'}`, 20, 90)
    pdf.text(`Descrição: ${orderData.description || 'N/A'}`, 20, 100)
    
    if (orderData.scheduled_date) {
      pdf.text(`Data Agendada: ${new Date(orderData.scheduled_date).toLocaleDateString('pt-BR')}`, 20, 110)
    }
    
    if (orderData.cost) {
      pdf.text(`Custo: R$ ${orderData.cost}`, 20, 120)
    }

    // Gerar buffer do PDF
    const pdfBuffer = new Uint8Array(pdf.output('arraybuffer'))

    // Criar nome do arquivo para o download
    const fileName = `ordem_servico_${orderData.order_number}_${Date.now()}.pdf`

    console.log('PDF gerado com sucesso:', fileName)

    // Retornar o PDF diretamente como blob
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    })

  } catch (error) {
    console.error('Erro ao gerar PDF da ordem de serviço:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao gerar PDF' },
      { status: 500 }
    )
  }
}