// Teste para verificar se o problema está na importação do database.js

async function testDatabaseImport() {
  console.log('🔍 Teste de Importação do Database.js');
  console.log('===================================');

  try {
    console.log('\n1. Carregando variáveis de ambiente...');
    require('dotenv').config();
    console.log('✅ Variáveis carregadas');

    console.log('\n2. Tentando importar database.js...');
    
    // Tentar importar usando require (CommonJS)
    try {
      console.log('Tentando require...');
      const database = require('./lib/database.js');
      console.log('❌ Require falhou (esperado, pois é ES module)');
    } catch (error) {
      console.log('✅ Require falhou como esperado:', error.message);
    }

    // Tentar importar usando import dinâmico
    console.log('\n3. Tentando import dinâmico...');
    const { query } = await import('./lib/database.js');
    console.log('✅ Import dinâmico funcionou!');
    console.log('✅ Função query importada:', typeof query);

    console.log('\n4. Testando função query...');
    const testSQL = 'SELECT 1 as test';
    const result = await query(testSQL, []);
    console.log('✅ Query executada com sucesso:', result);

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDatabaseImport();