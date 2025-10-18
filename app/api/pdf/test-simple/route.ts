import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Iniciando teste de PDF simples...');
    
    // Primeiro, testar se conseguimos importar jsPDF
    let jsPDF;
    try {
      const jsPDFModule = await import('jspdf');
      jsPDF = jsPDFModule.jsPDF;
      console.log('jsPDF importado com sucesso');
    } catch (importError) {
      console.error('Erro ao importar jsPDF:', importError);
      return NextResponse.json(
        { 
          error: 'Erro ao importar jsPDF',
          details: importError.message
        },
        { status: 500 }
      );
    }
    
    // Criar PDF usando jsPDF
    const doc = new jsPDF();
    console.log('Instância jsPDF criada');
    
    // Configurar fonte padrão
    doc.setFont('helvetica');
    console.log('Fonte configurada');
    
    // Adicionar texto simples
    doc.setFontSize(20);
    doc.text('Teste de PDF', 20, 30);
    
    doc.setFontSize(12);
    doc.text('Este é um teste simples de geração de PDF.', 20, 50);
    doc.text('Se você está vendo isso, o PDF foi gerado com sucesso!', 20, 70);
    console.log('Texto adicionado ao PDF');
    
    // Gerar PDF como buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    console.log('PDF buffer gerado, tamanho:', pdfBuffer.length);
    
    console.log('PDF simples gerado com sucesso!');
    
    // Retornar PDF diretamente
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="teste-simples.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Erro ao gerar PDF simples:', error);
    console.error('Stack trace:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    return NextResponse.json(
      { 
        error: 'Erro ao gerar PDF simples',
        details: {
          message: error.message,
          name: error.name,
          stack: error.stack
        }
      },
      { status: 500 }
    );
  }
}