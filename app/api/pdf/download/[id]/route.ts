import { NextRequest, NextResponse } from 'next/server';
import { createConnection } from '@/lib/db';
import jsPDF from 'jspdf';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Conectar ao banco de dados
    const connection = await createConnection();
    
    // Buscar dados da ordem de serviço
    const [rows] = await connection.execute(`
      SELECT 
        so.order_number,
        so.description,
        so.priority,
        so.status,
        so.requested_date,
        so.scheduled_date,
        so.completion_date,
        so.cost,
        so.observations,
        so.type,
        e.name as equipment_name,
        e.model as equipment_model,
        emp.name as company_name
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN empresas emp ON so.company_id = emp.id
      WHERE so.id = ?
    `, [id]);

    await connection.end();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 });
    }

    const order = rows[0] as any;

    // Criar PDF em memória usando jsPDF
    const doc = new jsPDF();
    
    // Configurar fonte e tamanho
    doc.setFontSize(16);
    doc.text('ORDEM DE SERVIÇO', 20, 20);
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    
    // Informações da ordem
    doc.setFontSize(12);
    let yPosition = 35;
    
    doc.text(`Número: ${order.order_number}`, 20, yPosition);
    yPosition += 8;
    
    doc.text(`Equipamento: ${order.equipment_name || 'N/A'} - ${order.equipment_model || 'N/A'}`, 20, yPosition);
    yPosition += 8;
    
    doc.text(`Empresa: ${order.company_name || 'TechMed Soluções'}`, 20, yPosition);
    yPosition += 8;
    
    doc.text(`Tipo: ${order.type || 'Preventiva'}`, 20, yPosition);
    yPosition += 8;
    
    doc.text(`Status: ${order.status}`, 20, yPosition);
    yPosition += 8;
    
    doc.text(`Prioridade: ${order.priority}`, 20, yPosition);
    yPosition += 12;
    
    // Datas
    doc.text(`Data Solicitada: ${new Date(order.requested_date).toLocaleDateString('pt-BR')}`, 20, yPosition);
    yPosition += 8;
    
    if (order.scheduled_date) {
      doc.text(`Data Agendada: ${new Date(order.scheduled_date).toLocaleDateString('pt-BR')}`, 20, yPosition);
      yPosition += 8;
    }
    
    if (order.completion_date) {
      doc.text(`Data Conclusão: ${new Date(order.completion_date).toLocaleDateString('pt-BR')}`, 20, yPosition);
      yPosition += 8;
    }
    
    yPosition += 8;
    
    // Descrição
    doc.text('Descrição:', 20, yPosition);
    yPosition += 8;
    
    const descriptionLines = doc.splitTextToSize(order.description || '', 170);
    doc.text(descriptionLines, 20, yPosition);
    yPosition += descriptionLines.length * 6 + 8;
    
    // Observações
    if (order.observations) {
      doc.text('Observações:', 20, yPosition);
      yPosition += 8;
      
      const observationLines = doc.splitTextToSize(order.observations, 170);
      doc.text(observationLines, 20, yPosition);
      yPosition += observationLines.length * 6 + 8;
    }
    
    // Custo
    if (order.cost) {
      doc.text(`Custo: R$ ${parseFloat(order.cost).toFixed(2).replace('.', ',')}`, 20, yPosition);
      yPosition += 12;
    }
    
    // Data de geração
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, yPosition);
    
    // Gerar PDF como buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    // Retornar PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ordem_servico_${order.order_number.replace('/', '_')}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Erro ao gerar arquivo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}