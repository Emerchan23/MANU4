import { NextRequest, NextResponse } from 'next/server'
import { getConnection } from '@/lib/database'
import PDFDocument from 'pdfkit'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const equipmentId = parseInt(params.id)

  if (isNaN(equipmentId)) {
    return NextResponse.json(
      { error: 'ID do equipamento inválido' },
      { status: 400 }
    )
  }

  let connection
  try {
    connection = await getConnection()
    
    // Buscar dados do equipamento com timeout
    const [equipmentRows] = await Promise.race([
      connection.execute(`
        SELECT 
          e.id, e.name, e.serial_number, e.code, e.model, 
          e.manufacturer, e.status, s.name as sector_name
        FROM equipment e
        LEFT JOIN sectors s ON e.sector_id = s.id
        WHERE e.id = ?
      `, [equipmentId]),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na consulta do equipamento')), 5000)
      )
    ])

    if (!equipmentRows || equipmentRows.length === 0) {
      return NextResponse.json(
        { error: 'Equipamento não encontrado' },
        { status: 404 }
      )
    }

    const equipment = equipmentRows[0]

    // Buscar histórico de manutenções com timeout e limite menor
    let historyRows = []
    try {
      const [scheduleRows] = await Promise.race([
        connection.execute(`
          SELECT 
            ms.id,
            ms.scheduled_date as date,
            COALESCE(ms.maintenance_type, 'Manutenção') as type,
            COALESCE(ms.description, 'Sem descrição') as description,
            ms.status,
            COALESCE(u.name, 'Não atribuído') as technician_name,
            COALESCE(ms.estimated_cost, 0) as cost
          FROM maintenance_schedules ms
          LEFT JOIN users u ON (ms.assigned_to = u.id OR ms.assigned_user_id = u.id)
          WHERE ms.equipment_id = ?
          ORDER BY ms.scheduled_date DESC
          LIMIT 10
        `, [equipmentId]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout na consulta do histórico')), 3000)
        )
      ])
      
      historyRows = scheduleRows || []
    } catch (error) {
      console.log('Erro ao buscar histórico:', error.message)
      historyRows = []
    }

    // Buscar estatísticas com timeout
    let stats = {
      total_maintenances: 0,
      total_cost: 0,
      average_repair_time: 0,
      success_rate: 0
    }
    
    try {
      const [statsRows] = await Promise.race([
        connection.execute(`
          SELECT 
            COUNT(*) as total_maintenances,
            COALESCE(SUM(estimated_cost), 0) as total_cost,
            ROUND(
              (COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) * 100.0 / 
               NULLIF(COUNT(*), 0)), 1
            ) as success_rate
          FROM maintenance_schedules 
          WHERE equipment_id = ?
        `, [equipmentId]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout na consulta de estatísticas')), 3000)
        )
      ])
      
      if (statsRows && statsRows.length > 0) {
        stats = {
          total_maintenances: statsRows[0].total_maintenances || 0,
          total_cost: statsRows[0].total_cost || 0,
          average_repair_time: 0,
          success_rate: statsRows[0].success_rate || 0
        }
      }
    } catch (error) {
      console.log('Erro ao buscar estatísticas:', error.message)
    }

    // Gerar PDF
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    })

    // Header
    doc.fontSize(20).text('Relatório de Manutenção - Equipamento', { align: 'center' })
    doc.moveDown()

    // Equipment Info
    doc.fontSize(16).text('Informações do Equipamento', { underline: true })
    doc.moveDown(0.5)
    doc.fontSize(12)
    doc.text(`Nome: ${equipment.name || 'N/A'}`)
    doc.text(`Código: ${equipment.serial_number || equipment.code || 'N/A'}`)
    doc.text(`Modelo: ${equipment.model || 'N/A'}`)
    doc.text(`Fabricante: ${equipment.manufacturer || 'N/A'}`)
    doc.text(`Setor: ${equipment.sector_name || 'N/A'}`)
    doc.text(`Status: ${equipment.status || 'N/A'}`)
    doc.moveDown()

    // Statistics
    doc.fontSize(16).text('Estatísticas', { underline: true })
    doc.moveDown(0.5)
    doc.fontSize(12)
    doc.text(`Total de Manutenções: ${stats.total_maintenances}`)
    doc.text(`Custo Total: R$ ${parseFloat(stats.total_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
    doc.text(`Tempo Médio de Reparo: ${Math.round(parseFloat(stats.average_repair_time))} horas`)
    doc.text(`Taxa de Sucesso: ${parseFloat(stats.success_rate)}%`)
    doc.moveDown()

    // Maintenance History
    doc.fontSize(16).text('Histórico de Manutenções', { underline: true })
    doc.moveDown(0.5)

    if (historyRows && historyRows.length > 0) {
      historyRows.forEach((record: any, index: number) => {
        if (index > 0) doc.moveDown(0.3)
        
        doc.fontSize(12)
        const date = new Date(record.date).toLocaleDateString('pt-BR')
        doc.text(`${index + 1}. Data: ${date}`)
        doc.text(`   Tipo: ${record.type}`)
        doc.text(`   Status: ${record.status}`)
        doc.text(`   Técnico: ${record.technician_name}`)
        doc.text(`   Custo: R$ ${parseFloat(record.cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
        if (record.description && record.description !== 'Sem descrição') {
          doc.text(`   Descrição: ${record.description}`)
        }
      })
    } else {
      doc.fontSize(12).text('Nenhuma manutenção registrada para este equipamento.')
    }

    // Footer
    doc.moveDown()
    doc.fontSize(10).text(`Relatório gerado em ${new Date().toLocaleString('pt-BR')}`, { align: 'center' })

    doc.end()

    const pdfBuffer = await pdfPromise

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-equipamento-${equipment.serial_number || equipment.code || equipment.id}.pdf"`
      }
    })

  } catch (error) {
    console.error('Erro ao gerar PDF do equipamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  } finally {
    // Garantir que a conexão seja fechada
    if (connection) {
      try {
        await connection.end()
      } catch (err) {
        console.log('Erro ao fechar conexão:', err)
      }
    }
  }
}