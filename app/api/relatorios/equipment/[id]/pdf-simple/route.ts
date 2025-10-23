import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sistema_manutencao',
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

// Função para gerar PDF simples usando texto puro
function generateSimplePDF(equipment: any, maintenances: any[]): Buffer {
  // Cabeçalho PDF básico
  const pdfHeader = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 6 0 R
>>
stream
BT
/F1 12 Tf
50 750 Td
(RELATORIO DE EQUIPAMENTO) Tj
0 -30 Td
(================================) Tj
0 -30 Td
(ID: ${equipment.id}) Tj
0 -20 Td
(Nome: ${(equipment.name || 'N/A').replace(/[^\w\s-]/g, ' ')}) Tj
0 -20 Td
(Modelo: ${(equipment.model || 'N/A').replace(/[^\w\s-]/g, ' ')}) Tj
0 -20 Td
(Serie: ${(equipment.serial_number || 'N/A').replace(/[^\w\s-]/g, ' ')}) Tj
0 -20 Td
(Fabricante: ${(equipment.manufacturer || 'N/A').replace(/[^\w\s-]/g, ' ')}) Tj
0 -20 Td
(Status: ${getStatusText(equipment.status)}) Tj
0 -40 Td
(HISTORICO DE MANUTENCOES:) Tj
0 -20 Td
(================================) Tj`

  let maintenanceContent = ''
  if (maintenances.length > 0) {
    maintenances.forEach((maintenance: any, index: number) => {
      const description = (maintenance.description || 'Sem descricao').replace(/[^\w\s-]/g, ' ')
      const status = (maintenance.status || 'N/A').replace(/[^\w\s-]/g, ' ')
      const date = new Date(maintenance.created_at).toLocaleDateString('pt-BR')
      
      maintenanceContent += `
0 -20 Td
(${index + 1}. ID: ${maintenance.id}) Tj
0 -15 Td
(   Descricao: ${description.substring(0, 50)}) Tj
0 -15 Td
(   Status: ${status}) Tj
0 -15 Td
(   Data: ${date}) Tj`
    })
  } else {
    maintenanceContent = `
0 -20 Td
(Nenhuma manutencao encontrada) Tj`
  }

  const pdfFooter = `${maintenanceContent}
0 -40 Td
(Gerado em: ${new Date().toLocaleString('pt-BR')}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

6 0 obj
${(pdfHeader + maintenanceContent + 'ET').length}
endobj

xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
0000000274 00000 n 
0000001000 00000 n 
0000001074 00000 n 
trailer
<<
/Size 7
/Root 1 0 R
>>
startxref
1095
%%EOF`

  return Buffer.from(pdfHeader + pdfFooter, 'utf-8')
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

    console.log(`📊 PDF SIMPLE: Gerando relatorio para equipamento ID: ${equipmentId}`)

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

    // Buscar últimas 3 manutenções
    const [maintenanceRows] = await connection.execute(
      'SELECT id, description, status, created_at FROM service_orders WHERE equipment_id = ? ORDER BY created_at DESC LIMIT 3',
      [equipmentId]
    )

    const maintenances = Array.isArray(maintenanceRows) ? maintenanceRows : []

    // Gerar PDF simples
    const pdfBuffer = generateSimplePDF(equipment, maintenances)

    console.log(`✅ PDF Simple gerado: ${pdfBuffer.length} bytes`)

    // Validar tamanho mínimo
    if (pdfBuffer.length < 500) {
      throw new Error('PDF gerado muito pequeno, possivel corrupcao')
    }

    // Retornar PDF para download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-equipamento-${equipmentId}-simple.pdf"`,
        'Cache-Control': 'no-cache',
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('❌ Erro ao gerar relatorio PDF Simple:', error)
    
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