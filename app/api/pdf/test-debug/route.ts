import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Iniciando teste de debug do jsPDF...');
    
    // Importação dinâmica do jsPDF
    let jsPDF;
    try {
      const jsPDFModule = await import('jspdf');
      jsPDF = jsPDFModule.jsPDF;
      console.log('jsPDF importado com sucesso');
    } catch (importError) {
      console.error('Erro ao importar jsPDF:', importError);
      return NextResponse.json({ 
        error: 'Erro ao importar jsPDF', 
        details: importError.message 
      }, { status: 500 });
    }

    const doc = new jsPDF();
    console.log('Instância jsPDF criada');

    // Teste dos valores que estão causando erro
    const osBoxX = 210 - 70 - 20; // 120
    const osBoxY = 8;
    const osBoxWidth = 70;
    const height = 34;
    
    console.log('Valores para rect:', { osBoxX, osBoxY, osBoxWidth, height });
    console.log('Tipos:', {
      osBoxX: typeof osBoxX,
      osBoxY: typeof osBoxY, 
      osBoxWidth: typeof osBoxWidth,
      height: typeof height
    });

    // Teste do rect que está falhando
    try {
      doc.rect(osBoxX, osBoxY, osBoxWidth, height, 'F');
      console.log('✓ rect() executado com sucesso');
    } catch (rectError) {
      console.error('✗ Erro no rect():', rectError);
      return NextResponse.json({ 
        error: 'Erro no jsPDF.rect', 
        details: rectError.message,
        values: { osBoxX, osBoxY, osBoxWidth, height }
      }, { status: 500 });
    }

    // Gerar PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test-debug.pdf"',
      },
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    }, { status: 500 });
  }
}