require('dotenv').config();
const mysql = require('mysql2/promise');

async function testOSNumber() {
  let connection;
  
  try {
    console.log('🔌 Conectando ao banco de dados...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco hospital_maintenance');
    
    // Verificar se a tabela counters existe
    const [tables] = await connection.execute('SHOW TABLES LIKE "counters"');
    
    if (tables.length === 0) {
      console.log('📝 Criando tabela counters...');
      await connection.execute(`
        CREATE TABLE counters (
          entity_type VARCHAR(50) NOT NULL,
          year INT NOT NULL,
          counter INT DEFAULT 0,
          PRIMARY KEY (entity_type, year)
        )
      `);
      console.log('✅ Tabela counters criada!');
    }
    
    // Resetar contador para 2024
    await connection.execute(
      'INSERT INTO counters (entity_type, year, counter) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE counter = 0',
      ['service_orders', 2024]
    );
    console.log('🔄 Contador resetado para 2024');
    
    // Testar geração de números
    console.log('\n🧪 Testando geração de números OS...');
    
    // Simular a função getNextNumber
    for (let i = 1; i <= 3; i++) {
      // Incrementar contador
      await connection.execute(
        'UPDATE counters SET counter = counter + 1 WHERE entity_type = ? AND year = ?',
        ['service_orders', 2024]
      );
      
      // Obter novo valor
      const [result] = await connection.execute(
        'SELECT counter FROM counters WHERE entity_type = ? AND year = ?',
        ['service_orders', 2024]
      );
      
      const counter = result[0].counter;
      const osNumber = `OS-${counter.toString().padStart(3, '0')}-2024`;
      
      console.log(`✅ OS ${i}: ${osNumber}`);
    }
    
    await connection.end();
    console.log('\n🎉 Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (connection) {
      await connection.end();
    }
  }
}

testOSNumber();