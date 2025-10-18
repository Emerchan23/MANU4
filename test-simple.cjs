console.log('🧪 Iniciando teste simples...');

const mysql = require('mysql2/promise');

async function testSimple() {
  console.log('📝 Função testSimple iniciada');
  
  try {
    console.log('🔌 Conectando ao banco...');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado com sucesso!');
    
    const testData = {
      name: 'Empresa Teste Simples',
      contracts: JSON.stringify([{ numero: 'CT-001', escopo: 'Teste' }])
    };
    
    console.log('📋 Dados de teste:', testData);
    
    const [result] = await connection.execute(`
      INSERT INTO companies (name, contracts) VALUES (?, ?)
    `, [testData.name, testData.contracts]);
    
    console.log('✅ Inserção realizada! ID:', result.insertId);
    
    const [rows] = await connection.execute(
      'SELECT id, name, contracts FROM companies WHERE id = ?',
      [result.insertId]
    );
    
    console.log('🔍 Dados recuperados:', rows[0]);
    
    await connection.end();
    console.log('🔚 Conexão fechada');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

console.log('🚀 Chamando função testSimple...');
testSimple().then(() => {
  console.log('✅ Teste concluído!');
}).catch(error => {
  console.error('❌ Erro no teste:', error);
});