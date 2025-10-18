import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  console.log('🔍 GET test-body-parsing - iniciado')
  
  try {
    return NextResponse.json({ 
      success: true, 
      message: 'GET funcionando',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Erro no GET:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log('🔍 POST test-body-parsing - iniciado')
  console.log('📋 Headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    // Teste 1: Verificar se o request existe
    console.log('✅ Request object exists:', !!request)
    
    // Teste 2: Verificar método
    console.log('📝 Method:', request.method)
    
    // Teste 3: Verificar URL
    console.log('🔗 URL:', request.url)
    
    // Teste 4: Tentar ler o body como texto primeiro
    let bodyText = ''
    try {
      bodyText = await request.text()
      console.log('📄 Body as text:', bodyText)
      console.log('📏 Body length:', bodyText.length)
    } catch (textError) {
      console.error('❌ Erro ao ler body como texto:', textError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao ler body como texto',
        details: textError instanceof Error ? textError.message : String(textError)
      }, { status: 500 })
    }
    
    // Teste 5: Tentar fazer parse do JSON se houver conteúdo
    let jsonData = null
    if (bodyText.trim()) {
      try {
        jsonData = JSON.parse(bodyText)
        console.log('📦 JSON parsed:', jsonData)
      } catch (jsonError) {
        console.error('❌ Erro no parse JSON:', jsonError)
        return NextResponse.json({ 
          success: false, 
          error: 'JSON inválido',
          bodyText: bodyText,
          details: jsonError instanceof Error ? jsonError.message : String(jsonError)
        }, { status: 400 })
      }
    }
    
    console.log('✅ POST test-body-parsing - sucesso')
    return NextResponse.json({ 
      success: true, 
      message: 'POST funcionando',
      receivedData: jsonData,
      bodyLength: bodyText.length,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Erro geral no POST:', error)
    console.error('📊 Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno no servidor',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}