const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  console.log('🔍 Testando conexão com o banco de dados...');
  
  const config = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance',
    port: 3306
  };
  
  try {
    console.log('📡 Tentando conectar com:', config);
    const connection = await mysql.createConnection(config);
    
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar se a tabela equipment existe
    console.log('🔍 Verificando tabela equipment...');
    const [tables] = await connection.execute("SHOW TABLES LIKE 'equipment'");
    console.log('📊 Tabelas encontradas:', tables);
    
    if (tables.length > 0) {
      // Verificar se existem equipamentos
      console.log('🔍 Verificando equipamentos...');
      const [equipments] = await connection.execute("SELECT id, name FROM equipment LIMIT 5");
      console.log('📊 Equipamentos encontrados:', equipments);
      
      if (equipments.length > 0) {
        // Testar busca por ID específico
        console.log('🔍 Buscando equipamento ID 1...');
        const [equipment] = await connection.execute("SELECT * FROM equipment WHERE id = ?", [1]);
        console.log('📊 Equipamento ID 1:', equipment);
      }
    }
    
    await connection.end();
    console.log('✅ Teste de conexão concluído!');
    
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
    console.error('📋 Detalhes:', error);
    
    // Sugestões de solução
    console.log('\n🔧 Possíveis soluções:');
    console.log('1. Verificar se o XAMPP/MySQL está rodando');
    console.log('2. Verificar se o banco "hospital_maintenance" existe');
    console.log('3. Verificar credenciais de acesso');
    console.log('4. Verificar se a porta 3306 está disponível');
  }
  
  process.exit(0);
}

testDatabaseConnection();