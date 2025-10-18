import dotenv from 'dotenv';
import { getNextNumber } from './lib/database.js';

// Carregar variáveis de ambiente
dotenv.config();

async function testOSFormat() {
  try {
    console.log('🧪 Testando formato de numeração OS...');
    
    // Gerar alguns números de teste
    for (let i = 1; i <= 3; i++) {
      const orderNumber = await getNextNumber('service_orders');
      console.log(`✅ OS ${i}: ${orderNumber}`);
    }
    
    console.log('\n🎉 Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro ao testar formato:', error.message);
  }
  
  process.exit(0);
}

testOSFormat();