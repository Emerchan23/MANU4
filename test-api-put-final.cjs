const http = require('http')

async function testApiPutEmpresa() {
  try {
    console.log('🧪 Testando API PUT /api/companies após correções...')
    
    // Dados de teste similares ao que o frontend envia
    const testData = {
      id: 1,
      name: 'TechService Ltda - CORRIGIDO',
      cnpj: '12.345.678/0001-90',
      contact_person: 'João Silva - CORRIGIDO',
      phone: '(11) 99999-9999',
      email: 'contato@techservice.com',
      address: 'Rua das Flores, 123 - São Paulo/SP'
    }
    
    console.log('📤 Enviando dados:', JSON.stringify(testData, null, 2))
    
    const postData = JSON.stringify(testData)
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/companies',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }
    
    const req = http.request(options, (res) => {
      console.log('📊 Status da resposta:', res.statusCode)
      console.log('📊 Headers:', res.headers)
      
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        console.log('📄 Resposta bruta:', data)
        
        try {
          const jsonData = JSON.parse(data)
          console.log('📄 Resposta JSON:', JSON.stringify(jsonData, null, 2))
        } catch (e) {
          console.log('❌ Resposta não é JSON válido')
        }
        
        if (res.statusCode === 200) {
          console.log('✅ API funcionou corretamente')
        } else {
          console.log('❌ API retornou erro')
        }
      })
    })
    
    req.on('error', (error) => {
      console.error('❌ Erro na requisição:', error)
    })
    
    req.write(postData)
    req.end()
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error)
  }
}

testApiPutEmpresa()