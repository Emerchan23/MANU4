import { NextRequest, NextResponse } from 'next/server'
import { getConnection } from '@/lib/database'
import PDFDocument from 'pdfkit'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = parseInt(params.id)

    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: 'ID da empresa inválido' },
        { status: 400 }
      )
    }

    const connection = await getConnection()
    
    // Buscar informações da empresa
    const [companyRows] = await connection.execute(`
      SELECT 
        c.id,
        c.name,
        c.cnpj,
        c.contact_email,
        c.contact_phone
      FROM companies c
      WHERE c.id = ?
    `, [companyId])

    if (!companyRows || companyRows.length === 0) {
      await connection.end()
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      )
    }

    const company = companyRows[0]

    // Buscar estatísticas financeiras
    const [statsRows] = await connection.execute(`
      SELECT 
        COUNT(*) as total_services,
        COALESCE(SUM(estimated_cost), 0) as total_spent,
        COALESCE(AVG(estimated_cost), 0) as average_cost_per_service,
        MIN(scheduled_date) as first_service_date,
        MAX(scheduled_date) as last_service_date,
        COUNT(CASE WHEN status = 'CONCLUIDA' THEN 1 END) as completed_services,
        COUNT(CASE WHEN status = 'PENDENTE' THEN 1 END) as pending_services,
        COUNT(CASE WHEN status = 'EM_ANDAMENTO' THEN 1 END) as in_progress_services
      FROM (
        SELECT 
          estimated_cost, 
          scheduled_date, 
          status
        FROM maintenance_schedules 
        WHERE company_id = ?
        
        UNION ALL
        
        SELECT 
          estimated_cost, 
          scheduled_date, 
          status
        FROM service_orders 
        WHERE company_id = ?
      ) combined_services
    `, [companyId, companyId])

    // Buscar serviços detalhados
    const [servicesRows] = await connection.execute(`
      SELECT 
        ms.id,
        ms.scheduled_date as date,
        ms.maintenance_type as type,
        ms.description,
        ms.status,
        COALESCE(ms.estimated_cost, 0) as cost,
        e.name as equipment_name,
        e.code as equipment_code,
        COALESCE(u.name, 'Não atribuído') as technician_name
      FROM maintenance_schedules ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN users u ON ms.assigned_technician_id = u.id
      WHERE ms.company_id = ?
      
      UNION ALL
      
      SELECT 
        so.id,
        COALESCE(so.completed_at, so.scheduled_date, so.created_at) as date,
        so.maintenance_type as type,
        so.description,
        so.status,
        COALESCE(so.estimated_cost, 0) as cost,
        e.name as equipment_name,
        e.code as equipment_code,
        COALESCE(u.name, 'Não atribuído') as technician_name
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN users u ON so.assigned_technician_id = u.id
      WHERE so.company_id = ?
      
      ORDER BY date DESC
      LIMIT 50
    `, [companyId, companyId])

    // Buscar tipos de serviços mais frequentes
    const [serviceTypesRows] = await connection.execute(`
      SELECT 
        maintenance_type,
        COUNT(*) as count,
        COALESCE(SUM(estimated_cost), 0) as total_cost
      FROM (
        SELECT maintenance_type, estimated_cost
        FROM maintenance_schedules 
        WHERE company_id = ?
        
        UNION ALL
        
        SELECT maintenance_type, estimated_cost
        FROM service_orders 
        WHERE company_id = ?
      ) combined_services
      GROUP BY maintenance_type
      ORDER BY count DESC
      LIMIT 10
    `, [companyId, companyId])

    await connection.end()

    const stats = statsRows[0] || {
      total_services: 0,
      total_spent: 0,
      average_cost_per_service: 0,
      first_service_date: null,
      last_service_date: null,
      completed_services: 0,
      pending_services: 0,
      in_progress_services: 0
    }

    // Gerar PDF
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    })

    // Header
    doc.fontSize(20).text('Relatório Financeiro - Empresa', { align: 'center' })
    doc.moveDown()

    // Company Info
    doc.fontSize(16).text('Informações da Empresa', { underline: true })
    doc.moveDown(0.5)
    doc.fontSize(12)
    doc.text(`Nome: ${company.name}`)
    doc.text(`CNPJ: ${company.cnpj || 'N/A'}`)
    doc.text(`Email: ${company.contact_email || 'N/A'}`)
    doc.text(`Telefone: ${company.contact_phone || 'N/A'}`)
    doc.moveDown()

    // Financial Statistics
    doc.fontSize(16).text('Estatísticas Financeiras', { underline: true })
    doc.moveDown(0.5)
    doc.fontSize(12)
    doc.text(`Total de Serviços: ${stats.total_services}`)
    doc.text(`Total Gasto: R$ ${parseFloat(stats.total_spent).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
    doc.text(`Custo Médio por Serviço: R$ ${parseFloat(stats.average_cost_per_service).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
    doc.text(`Serviços Concluídos: ${stats.completed_services}`)
    doc.text(`Serviços Pendentes: ${stats.pending_services}`)
    doc.text(`Serviços em Andamento: ${stats.in_progress_services}`)
    
    if (stats.first_service_date) {
      doc.text(`Primeiro Serviço: ${new Date(stats.first_service_date).toLocaleDateString('pt-BR')}`)
    }
    if (stats.last_service_date) {
      doc.text(`Último Serviço: ${new Date(stats.last_service_date).toLocaleDateString('pt-BR')}`)
    }
    doc.moveDown()

    // Service Types
    if (serviceTypesRows && serviceTypesRows.length > 0) {
      doc.fontSize(16).text('Tipos de Serviços Mais Frequentes', { underline: true })
      doc.moveDown(0.5)
      doc.fontSize(12)
      
      serviceTypesRows.forEach((serviceType: any, index: number) => {
        doc.text(`${index + 1}. ${serviceType.maintenance_type}: ${serviceType.count} serviços - R$ ${parseFloat(serviceType.total_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      })
      doc.moveDown()
    }

    // Recent Services
    doc.fontSize(16).text('Serviços Recentes', { underline: true })
    doc.moveDown(0.5)

    if (servicesRows && servicesRows.length > 0) {
      servicesRows.slice(0, 20).forEach((service: any, index: number) => {
        if (index > 0) doc.moveDown(0.3)
        
        doc.fontSize(12)
        const date = new Date(service.date).toLocaleDateString('pt-BR')
        doc.text(`${index + 1}. Data: ${date}`)
        doc.text(`   Equipamento: ${service.equipment_name} (${service.equipment_code})`)
        doc.text(`   Tipo: ${service.type}`)
        doc.text(`   Status: ${service.status}`)
        doc.text(`   Técnico: ${service.technician_name}`)
        doc.text(`   Custo: R$ ${parseFloat(service.cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
        if (service.description) {
          doc.text(`   Descrição: ${service.description}`)
        }
      })
    } else {
      doc.fontSize(12).text('Nenhum serviço registrado para esta empresa.')
    }

    // Footer
    doc.moveDown()
    doc.fontSize(10).text(`Relatório gerado em ${new Date().toLocaleString('pt-BR')}`, { align: 'center' })

    doc.end()

    const pdfBuffer = await pdfPromise

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-empresa-${company.name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf"`
      }
    })

  } catch (error) {
    console.error('Erro ao gerar PDF da empresa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}