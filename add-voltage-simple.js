import 'dotenv/config'
import { query } from './lib/database.js'

async function addVoltageField() {
  try {
    console.log('🔌 Adicionando campo voltage na tabela equipment...')
    
    // Adicionar o campo voltage diretamente
    const result = await query("ALTER TABLE equipment ADD COLUMN voltage VARCHAR(20) NULL COMMENT 'Voltagem do equipamento (ex: 110V, 220V, 380V)'")
    console.log('✅ Campo voltage adicionado com sucesso!')
    console.log('Resultado:', result)
    
    process.exit(0)
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ Campo voltage já existe na tabela equipment')
      process.exit(0)
    } else {
      console.error('❌ Erro ao adicionar campo voltage:')
      console.error('  - Mensagem:', error.message)
      console.error('  - Código:', error.code)
      process.exit(1)
    }
  }
}

addVoltageField()