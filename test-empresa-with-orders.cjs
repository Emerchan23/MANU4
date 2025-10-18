const mysql = require('mysql2/promise');
const fs = require('fs');

async function testEmpresaWithOrders() {
  try {
    // Ler configuração do banco
    const envContent = fs.readFileSync('.env', 'utf8');
    const dbConfig = {};
    
    envContent.split('\n').forEach(line => {
      if (line.includes('DB_')) {
        const [key, value] = line.split('=');
        if (key && value) {
          dbConfig[key.trim()] = value.trim();
        }
      }
    });
    
    console.log('🔍 Conectando ao banco de dados...');
    
    const connection = await mysql.createConnection({
      host: dbConfig.DB_HOST || 'localhost',
      user: dbConfig.DB_USER || 'root',
      password: dbConfig.DB_PASSWORD || '',
      database: dbConfig.DB_NAME || 'sistema_manutencao'
    });
    
    console.log('✅ Conectado ao banco!');
    
    // Buscar empresas que têm ordens de serviço
    console.log('\n🔍 Buscando empresas com ordens de serviço...');
    const [empresasComOrdens] = await connection.execute(`
      SELECT 
        e.id, 
        e.nome, 
        COUNT(so.id) as total_ordens
      FROM empresas e
      INNER JOIN service_orders so ON e.id = so.company_id
      GROUP BY e.id, e.nome
      ORDER BY total_ordens DESC
      LIMIT 5
    `);
    
    console.log('\n📋 Empresas com ordens de serviço:');
    empresasComOrdens.forEach(empresa => {
      console.log(`- ${empresa.nome} (ID: ${empresa.id}) - ${empresa.total_ordens} ordens`);
    });
    
    // Buscar empresas sem ordens de serviço
    console.log('\n🔍 Buscando empresas SEM ordens de serviço...');
    const [empresasSemOrdens] = await connection.execute(`
      SELECT 
        e.id, 
        e.nome
      FROM empresas e
      LEFT JOIN service_orders so ON e.id = so.company_id
      WHERE so.id IS NULL
      LIMIT 5
    `);
    
    console.log('\n📋 Empresas SEM ordens de serviço (podem ser deletadas):');
    empresasSemOrdens.forEach(empresa => {
      console.log(`- ${empresa.nome} (ID: ${empresa.id})`);
    });
    
    // Verificar restrições de chave estrangeira
    console.log('\n🔍 Verificando restrições de chave estrangeira...');
    const [constraints] = await connection.execute(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE REFERENCED_TABLE_NAME = 'empresas' 
      AND TABLE_SCHEMA = ?
    `, [dbConfig.DB_NAME || 'sistema_manutencao']);
    
    console.log('\n🔗 Restrições de chave estrangeira encontradas:');
    constraints.forEach(constraint => {
      console.log(`- Tabela: ${constraint.TABLE_NAME}, Coluna: ${constraint.COLUMN_NAME} -> empresas.${constraint.REFERENCED_COLUMN_NAME}`);
    });
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testEmpresaWithOrders();