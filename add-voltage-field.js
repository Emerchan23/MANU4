import 'dotenv/config'
import { query } from './lib/database.js'

async function addVoltageField() {
  try {
    console.log('🔌 Adicionando campo voltage na tabela equipment...')
    
    // Verificar se o campo já existe
    const tableStructure = await query('DESCRIBE equipment')
    const hasVoltageField = tableStructure.some(col => col.Field === 'voltage')
    
    if (hasVoltageField) {
      console.log('✅ Campo voltage já existe na tabela equipment')
      return
    }
    
    // Adicionar o campo voltage
    await query("ALTER TABLE equipment ADD COLUMN voltage VARCHAR(20) NULL COMMENT 'Voltagem do equipamento (ex: 110V, 220V, 380V)'")
    console.log('✅ Campo voltage adicionado com sucesso!')
    
    // Verificar a estrutura atualizada
    console.log('\n📋 Estrutura atualizada da tabela equipment:')
    const updatedStructure = await query('DESCRIBE equipment')
    updatedStructure.forEach(column => {
      if (column.Field === 'voltage') {
        console.log(`  ✅ ${column.Field} (${column.Type}) ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} - NOVO CAMPO`)
      } else {
        console.log(`  - ${column.Field} (${column.Type}) ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'}`)
      }
    })
    
    console.log('\n🎉 Campo voltage criado com sucesso na tabela equipment!')
    
  } catch (error) {
    console.error('❌ Erro ao adicionar campo voltage:')
    console.error('  - Mensagem:', error.message)
    console.error('  - Código:', error.code)
  }
}

addVoltageField()