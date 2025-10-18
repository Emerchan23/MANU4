const fetch = require('node-fetch')

async function testApiPutEmpresa() {
  try {
    console.log('🧪 Testando API PUT /api/companies...')
    
    // Dados de teste similares ao que o frontend envia
    const testData = {
      id: 1,
      name: 'TechService Ltda - API TEST',
      cnpj: '12.345.678/0001-90',
      contact_person: 'João Silva - API TEST',
      phone: '(11) 99999-9999',
      email: 'contato@techservice.com',
      address: 'Rua das Flores, 123 - São Paulo/SP',
      specialties: 'Biomédica, Elétrica, Refrigeração'
    }
    
    console.log('📤 Enviando dados:', JSON.stringify(testData, null, 2))
    
    const response = await fetch('http://localhost:3000/api/companies', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })
    
    console.log('📊 Status da resposta:', response.status)
    console.log('📊 Status text:', response.statusText)
    
    const responseData = await response.text()
    console.log('📄 Resposta bruta:', responseData)
    
    try {
      const jsonData = JSON.parse(responseData)
      console.log('📄 Resposta JSON:', JSON.stringify(jsonData, null, 2))
    } catch (e) {
      console.log('❌ Resposta não é JSON válido')
    }
    
    if (response.ok) {
      console.log('✅ API funcionou corretamente')
    } else {
      console.log('❌ API retornou erro')
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error)
  }
}

testApiPutEmpresa()