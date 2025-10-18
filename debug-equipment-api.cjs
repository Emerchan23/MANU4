const path = require('path');
const fs = require('fs');

console.log('🔍 Debugging Equipment API Issue');
console.log('================================');

// Verificar variáveis de ambiente
console.log('\n1. Verificando variáveis de ambiente:');
require('dotenv').config();
console.log('DB_DATA_PATH:', process.env.DB_DATA_PATH);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Verificar se o arquivo .env existe
const envPath = path.join(__dirname, '.env');
console.log('\n2. Verificando arquivo .env:');
console.log('Caminho .env:', envPath);
console.log('Arquivo .env existe:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('Conteúdo do .env:');
  console.log(envContent);
}

// Verificar caminho do banco de dados
console.log('\n3. Verificando caminho do banco de dados:');
const dbPath = process.env.DB_DATA_PATH;
if (dbPath) {
  const fullDbPath = path.resolve(dbPath);
  console.log('Caminho completo do DB:', fullDbPath);
  console.log('Diretório existe:', fs.existsSync(fullDbPath));
  
  if (fs.existsSync(fullDbPath)) {
    const files = fs.readdirSync(fullDbPath);
    console.log('Arquivos no diretório:', files);
  }
}

// Testar importação do database.js
console.log('\n4. Testando importação do database.js:');
try {
  const database = require('./lib/database');
  console.log('✅ Database.js importado com sucesso');
  
  // Testar verificação de localização do banco
  console.log('\n5. Testando verificação de localização do banco:');
  try {
    database.verificarLocalizacaoBanco();
    console.log('✅ Verificação de localização passou');
  } catch (error) {
    console.log('❌ Erro na verificação de localização:', error.message);
  }
  
} catch (error) {
  console.log('❌ Erro ao importar database.js:', error.message);
  console.log('Stack:', error.stack);
}

// Testar importação da API de equipamentos
console.log('\n6. Testando importação da API de equipamentos:');
try {
  const equipmentAPI = require('./api/equipment');
  console.log('✅ Equipment API importada com sucesso');
} catch (error) {
  console.log('❌ Erro ao importar equipment API:', error.message);
  console.log('Stack:', error.stack);
}

console.log('\n================================');
console.log('🏁 Debug concluído');