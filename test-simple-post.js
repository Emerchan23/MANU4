// Teste simples para POST /api/alerts

async function testSimplePost() {
  try {
    console.log('🧪 Testando POST simples...')
    
    const response = await fetch('http://localhost:3000/api/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        equipmentId: 1,
        tipo: 'MANUTENCAO',
        prioridade: 'ALTA',
        descricao: 'Teste de alerta via API',
        dataVencimento: '2024-12-31',
        notificados: ['admin@hospital.com']
      })
    })

    console.log('📋 Status:', response.status)
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Sucesso:', data)
    } else {
      const errorText = await response.text()
      console.log('❌ Erro:', errorText)
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testSimplePost()