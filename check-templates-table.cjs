const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function checkTemplatesTable() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('🔍 Verificando tabela service_description_templates...');
    
    // Verificar se a tabela existe
    const [tables] = await connection.execute(
      'SHOW TABLES LIKE "service_description_templates"'
    );
    
    if (tables.length === 0) {
      console.log('❌ Tabela service_description_templates NÃO existe');
    } else {
      console.log('✅ Tabela service_description_templates existe');
      
      // Verificar estrutura da tabela
      const [structure] = await connection.execute('DESCRIBE service_description_templates');
      console.log('📋 Estrutura da tabela:');
      structure.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? col.Key : ''}`);
      });
      
      // Verificar dados
      const [count] = await connection.execute('SELECT COUNT(*) as total FROM service_description_templates');
      console.log(`📊 Total de templates: ${count[0].total}`);
      
      if (count[0].total > 0) {
        const [samples] = await connection.execute('SELECT id, name, is_active FROM service_description_templates LIMIT 3');
        console.log('📄 Exemplos de templates:');
        samples.forEach(template => {
          console.log(`  - ID: ${template.id}, Nome: ${template.name}, Ativo: ${template.is_active}`);
        });
      }
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ Erro ao verificar tabela de templates:', error.message);
  }
}

checkTemplatesTable();