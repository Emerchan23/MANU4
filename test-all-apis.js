import 'dotenv/config'

const API_BASE_URL = 'http://localhost:3000/api'

const apis = [
  { name: 'Dashboard Stats', url: '/dashboard/stats' },
  { name: 'Equipment List', url: '/equipment' },
  { name: 'Equipment Stats', url: '/equipment/stats' },
  { name: 'Sectors List', url: '/sectors' },
  { name: 'Categories List', url: '/categories' },
  { name: 'Service Orders List', url: '/service-orders' },
  { name: 'Service Orders Stats', url: '/service-orders/stats' },
  { name: 'Notifications List', url: '/notifications' },
  { name: 'Notifications Count', url: '/notifications/count' },
  { name: 'Users List', url: '/users' },
  { name: 'Companies List', url: '/companies' },
  { name: 'Reports Stats', url: '/reports/stats' },
  { name: 'Maintenance Chart', url: '/reports/maintenance-chart' },
  { name: 'Sessions List', url: '/sessions' },
  { name: 'User Settings', url: '/user-settings' },
  { name: 'User Preferences', url: '/user-preferences' }
]

async function testAPI(api) {
  try {
    const response = await fetch(`${API_BASE_URL}${api.url}`)
    const status = response.status
    
    if (status === 200) {
      const data = await response.json()
      return { 
        name: api.name, 
        status: 'SUCCESS', 
        code: status,
        dataLength: Array.isArray(data) ? data.length : (typeof data === 'object' ? Object.keys(data).length : 1)
      }
    } else {
      const errorText = await response.text()
      return { 
        name: api.name, 
        status: 'ERROR', 
        code: status, 
        error: errorText.substring(0, 100) 
      }
    }
  } catch (error) {
    return { 
      name: api.name, 
      status: 'ERROR', 
      code: 'NETWORK', 
      error: error.message 
    }
  }
}

async function testAllAPIs() {
  console.log('🧪 Testando todas as APIs do sistema...\n')
  
  const results = []
  let successCount = 0
  let errorCount = 0
  
  for (const api of apis) {
    const result = await testAPI(api)
    results.push(result)
    
    if (result.status === 'SUCCESS') {
      console.log(`✅ ${result.name} - ${result.code} (${result.dataLength} items)`)
      successCount++
    } else {
      console.log(`❌ ${result.name} - ${result.code} - ${result.error}`)
      errorCount++
    }
  }
  
  console.log('\n📊 RESUMO DOS TESTES:')
  console.log(`✅ APIs funcionando: ${successCount}`)
  console.log(`❌ APIs com erro: ${errorCount}`)
  console.log(`📈 Taxa de sucesso: ${((successCount / apis.length) * 100).toFixed(1)}%`)
  
  if (errorCount > 0) {
    console.log('\n🔍 DETALHES DOS ERROS:')
    results.filter(r => r.status === 'ERROR').forEach(result => {
      console.log(`- ${result.name}: ${result.code} - ${result.error}`)
    })
  }
  
  return { successCount, errorCount, results }
}

testAllAPIs().catch(console.error)