import 'dotenv/config'
import { query } from './lib/database.js'

async function checkTablesStructure() {
  try {
    console.log('🔍 Verificando estrutura das tabelas...')
    
    // Check categories table structure
    console.log('\n📂 Estrutura da tabela categories:')
    const categoriesStructure = await query('DESCRIBE categories')
    categoriesStructure.forEach(column => {
      console.log(`  - ${column.Field} (${column.Type}) ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'}`)
    })
    
    // Check if is_electrical field exists
    const hasElectricalField = categoriesStructure.some(col => col.Field === 'is_electrical')
    console.log(`\n⚡ Campo 'is_electrical' existe: ${hasElectricalField ? '✅ SIM' : '❌ NÃO'}`)
    
    if (hasElectricalField) {
      const electricalCategories = await query('SELECT id, name, is_electrical FROM categories WHERE is_electrical = 1')
      console.log('\n⚡ Categorias elétricas:')
      electricalCategories.forEach(cat => {
        console.log(`  - ID: ${cat.id}, Nome: ${cat.name}, Elétrica: ${cat.is_electrical}`)
      })
    }
    
    // Check equipment table structure
    console.log('\n📋 Estrutura da tabela equipment:')
    const equipmentStructure = await query('DESCRIBE equipment')
    equipmentStructure.forEach(column => {
      console.log(`  - ${column.Field} (${column.Type}) ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'}`)
    })
    
    // Check if voltage field exists
    const hasVoltageField = equipmentStructure.some(col => col.Field === 'voltage')
    console.log(`\n🔌 Campo 'voltage' existe: ${hasVoltageField ? '✅ SIM' : '❌ NÃO'}`)
    
    if (hasVoltageField) {
      const equipmentWithVoltage = await query('SELECT id, name, voltage FROM equipment WHERE voltage IS NOT NULL LIMIT 5')
      console.log('\n🔌 Equipamentos com voltagem:')
      equipmentWithVoltage.forEach(eq => {
        console.log(`  - ID: ${eq.id}, Nome: ${eq.name}, Voltagem: ${eq.voltage}`)
      })
    }
    
    console.log('\n✅ Verificação concluída!')
    
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura das tabelas:')
    console.error('  - Mensagem:', error.message)
    console.error('  - Código:', error.code)
  }
}

checkTablesStructure()