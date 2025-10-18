const mysql = require('mysql2/promise');

async function testMaintenanceTypes() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance',
      port: 3306
    });

    console.log('🔍 Testando tipos de manutenção cadastrados...');
    
    const [rows] = await connection.execute(
      'SELECT id, nome, descricao, categoria, ativo FROM tipos_manutencao WHERE ativo = 1 ORDER BY nome ASC'
    );
    
    console.log('📋 Tipos de manutenção ativos encontrados:');
    rows.forEach(row => {
      console.log(`- ID: ${row.id}, Nome: ${row.nome}, Categoria: ${row.categoria}`);
    });
    
    console.log(`\n✅ Total de tipos ativos: ${rows.length}`);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testMaintenanceTypes();