const http = require('http')

const BASE_URL = 'http://localhost:3000'

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    }

    if (data) {
      const jsonData = JSON.stringify(data)
      options.headers['Content-Length'] = Buffer.byteLength(jsonData)
    }

    const req = http.request(options, (res) => {
      let responseData = ''
      
      res.on('data', (chunk) => {
        responseData += chunk
      })
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: responseData
        })
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    if (data) {
      req.write(JSON.stringify(data))
    }
    
    req.end()
  })
}

async function testBodyParsing() {
  console.log('🧪 TESTE BODY PARSING')
  console.log('==============================')
  
  try {
    // Teste GET
    console.log('\n1️⃣ GET test-body-parsing:')
    console.log('📤 GET /api/test-body-parsing')
    
    const getResponse = await makeRequest('GET', '/api/test-body-parsing')
    console.log('📥 Status:', getResponse.status)
    console.log('📥 Response Length:', getResponse.data.length)
    console.log('📥 Response:', getResponse.data)
    
    try {
      const getJson = JSON.parse(getResponse.data)
      console.log('✅ JSON válido')
    } catch (e) {
      console.log('❌ JSON inválido:', e.message)
    }
    
    // Teste POST com dados simples
    console.log('\n2️⃣ POST test-body-parsing (dados simples):')
    console.log('📤 POST /api/test-body-parsing')
    
    const simpleData = { test: 'simple', value: 123 }
    console.log('📤 Enviando:', JSON.stringify(simpleData))
    
    const postResponse = await makeRequest('POST', '/api/test-body-parsing', simpleData)
    console.log('📥 Status:', postResponse.status)
    console.log('📥 Response Length:', postResponse.data.length)
    console.log('📥 Response:', postResponse.data)
    
    try {
      const postJson = JSON.parse(postResponse.data)
      console.log('✅ JSON válido')
    } catch (e) {
      console.log('❌ JSON inválido:', e.message)
    }
    
    // Teste POST com dados mais complexos
    console.log('\n3️⃣ POST test-body-parsing (dados complexos):')
    console.log('📤 POST /api/test-body-parsing')
    
    const complexData = {
      equipmentId: 1,
      title: 'Teste de Manutenção',
      description: 'Descrição detalhada',
      scheduledDate: '2024-01-15',
      priority: 'medium',
      estimatedDuration: 120
    }
    console.log('📤 Enviando:', JSON.stringify(complexData))
    
    const complexResponse = await makeRequest('POST', '/api/test-body-parsing', complexData)
    console.log('📥 Status:', complexResponse.status)
    console.log('📥 Response Length:', complexResponse.data.length)
    console.log('📥 Response:', complexResponse.data)
    
    try {
      const complexJson = JSON.parse(complexResponse.data)
      console.log('✅ JSON válido')
    } catch (e) {
      console.log('❌ JSON inválido:', e.message)
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

testBodyParsing()