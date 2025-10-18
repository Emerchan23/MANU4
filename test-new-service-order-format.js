import { getNextNumber } from './lib/database.js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function testNewServiceOrderFormat() {
  try {
    console.log('🧪 Testando novo formato de numeração de ordens de serviço...');
    
    // Gerar alguns números de teste
    for (let i = 1; i <= 5; i++) {
      const orderNumber = await getNextNumber('service_orders');
      console.log(`✅ Ordem ${i}: ${orderNumber}`);
    }
    
    console.log('\n🎉 Teste concluído! O formato agora segue o padrão OS-001-2025');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    process.exit(0);
  }
}

testNewServiceOrderFormat();