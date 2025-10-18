import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Iniciando teste específico do jsPDF.rect...');
    
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

    // Testar diferentes cenários de rect()
    const tests = [
      { name: 'Teste 1: Valores simples', x: 10, y: 10, w: 50, h: 20, style: 'F' },
      { name: 'Teste 2: Valores calculados', x: 120, y: 8, w: 70, h: 34, style: 'F' },
      { name: 'Teste 3: Sem estilo', x: 10, y: 50, w: 50, h: 20 },
      { name: 'Teste 4: Estilo S (stroke)', x: 10, y: 80, w: 50, h: 20, style: 'S' },
      { name: 'Teste 5: Valores decimais', x: 10.5, y: 110.5, w: 50.5, h: 20.5, style: 'F' },
    ];

    const results = [];

    for (const test of tests) {
      try {
        console.log(`Executando ${test.name}:`, test);
        
        if (test.style) {
          doc.rect(test.x, test.y, test.w, test.h, test.style);
        } else {
          doc.rect(test.x, test.y, test.w, test.h);
        }
        
        results.push({ test: test.name, status: 'SUCCESS' });
        console.log(`✓ ${test.name} passou`);
      } catch (error) {
        results.push({ 
          test: test.name, 
          status: 'FAILED', 
          error: error.message,
          values: test
        });
        console.log(`✗ ${test.name} falhou:`, error.message);
      }
    }

    // Gerar PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    return NextResponse.json({
      success: true,
      message: 'Testes de rect() concluídos',
      results: results,
      pdfGenerated: true,
      pdfSize: pdfBuffer.length
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    }, { status: 500 });
  }
}