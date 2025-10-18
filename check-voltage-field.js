import 'dotenv/config'
import { query } from './lib/database.js'

async function checkVoltageField() {
  try {
    console.log('🔍 Verificando estrutura da tabela equipment...')
    
    const result = await query('DESCRIBE equipment')
    
    console.log('\nEstrutura da tabela equipment:')
    result.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`)
    })
    
    const voltageField = result.find(col => col.Field === 'voltage')
    
    if (voltageField) {
      console.log('\n✅ Campo voltage encontrado:')
      console.log(`  - Tipo: ${voltageField.Type}`)
      console.log(`  - Permite NULL: ${voltageField.Null}`)
      console.log(`  - Padrão: ${voltageField.Default || 'NULL'}`)
      console.log(`  - Comentário: ${voltageField.Comment || 'Nenhum'}`)
    } else {
      console.log('\n❌ Campo voltage não encontrado')
    }
    
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura da tabela:')
    console.error('  - Mensagem:', error.message)
    process.exit(1)
  }
}

checkVoltageField()