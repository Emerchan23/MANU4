const mysql = require('mysql2/promise');
const fs = require('fs');

async function checkServiceOrdersTable() {
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
    
    // Verificar estrutura da tabela service_orders
    console.log('\n📊 Estrutura da tabela service_orders:');
    const [columns] = await connection.execute('DESCRIBE service_orders');
    
    columns.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? `(${column.Key})` : ''} ${column.Default !== null ? `DEFAULT ${column.Default}` : ''}`);
    });
    
    // Verificar alguns registros de exemplo
    console.log('\n📋 Registros de exemplo (primeiros 3):');
    const [rows] = await connection.execute('SELECT * FROM service_orders LIMIT 3');
    
    if (rows.length > 0) {
      console.log('Campos disponíveis:', Object.keys(rows[0]).join(', '));
      rows.forEach((row, index) => {
        console.log(`\n📄 Registro ${index + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      });
    } else {
      console.log('Nenhum registro encontrado na tabela.');
    }
    
    // Verificar se existem campos que podem estar causando problemas
    console.log('\n🔍 Verificando campos específicos...');
    const problematicFields = [
      'equipment_id', 'company_id', 'maintenance_type', 'actual_cost', 
      'completion_date', 'template_id', 'estimated_cost', 'scheduled_date'
    ];
    
    const existingFields = columns.map(col => col.Field);
    
    problematicFields.forEach(field => {
      if (existingFields.includes(field)) {
        const fieldInfo = columns.find(col => col.Field === field);
        console.log(`✅ ${field}: ${fieldInfo.Type} ${fieldInfo.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
      } else {
        console.log(`❌ ${field}: CAMPO NÃO EXISTE`);
      }
    });
    
    await connection.end();
    console.log('\n🔌 Conexão fechada');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkServiceOrdersTable();