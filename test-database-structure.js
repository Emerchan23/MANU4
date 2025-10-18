import 'dotenv/config'
import { query } from './lib/database.js'

async function testDatabaseStructure() {
  try {
    console.log('🔍 Testando conexão com o banco de dados...')
    
    // Test connection
    const testResult = await query('SELECT 1 as test')
    console.log('✅ Conexão com banco OK:', testResult)
    
    // Check equipment table structure
    console.log('\n📋 Verificando estrutura da tabela equipment...')
    const tableStructure = await query('DESCRIBE equipment')
    console.log('Colunas da tabela equipment:')
    tableStructure.forEach(column => {
      console.log(`  - ${column.Field} (${column.Type}) ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Key ? `KEY: ${column.Key}` : ''}`)
    })
    
    // Check if sectors table exists and has data
    console.log('\n🏢 Verificando tabela sectors...')
    try {
      const sectors = await query('SELECT id, name FROM sectors LIMIT 5')
      console.log('Setores disponíveis:')
      sectors.forEach(sector => {
        console.log(`  - ID: ${sector.id}, Nome: ${sector.name}`)
      })
    } catch (error) {
      console.log('❌ Erro ao acessar tabela sectors:', error.message)
    }
    
    // Check if categories table exists
    console.log('\n📂 Verificando tabela categories...')
    try {
      const categories = await query('SELECT id, name FROM categories LIMIT 5')
      console.log('Categorias disponíveis:')
      categories.forEach(category => {
        console.log(`  - ID: ${category.id}, Nome: ${category.name}`)
      })
    } catch (error) {
      console.log('❌ Erro ao acessar tabela categories:', error.message)
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar banco de dados:')
    console.error('  - Mensagem:', error.message)
    console.error('  - Código:', error.code)
    console.error('  - Errno:', error.errno)
    console.error('  - Stack:', error.stack)
  }
}

testDatabaseStructure()