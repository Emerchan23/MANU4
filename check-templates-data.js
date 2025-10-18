import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function checkTemplatesData() {
  let connection;
  
  try {
    console.log('🔍 Verificando dados existentes nas tabelas de templates...');
    
    // Conectar ao banco de dados
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');
    
    // Verificar categorias
    console.log('\n📂 CATEGORIAS DE TEMPLATES:');
    const [categories] = await connection.execute('SELECT * FROM template_categories ORDER BY name');
    categories.forEach(cat => {
      console.log(`  - ID: ${cat.id} | Nome: ${cat.name} | Descrição: ${cat.description}`);
    });
    
    // Verificar templates
    console.log('\n📝 TEMPLATES DE DESCRIÇÃO:');
    const [templates] = await connection.execute(`
      SELECT t.*, c.name as category_name 
      FROM service_description_templates t 
      LEFT JOIN template_categories c ON t.category_id = c.id 
      ORDER BY c.name, t.name
    `);
    
    templates.forEach(template => {
      console.log(`\n  📋 ${template.name}`);
      console.log(`     Categoria: ${template.category_name}`);
      console.log(`     Descrição: ${template.description.substring(0, 100)}...`);
      if (template.variables) {
        console.log(`     Variáveis: ${template.variables}`);
      }
    });
    
    console.log(`\n📊 RESUMO:`);
    console.log(`   - ${categories.length} categorias`);
    console.log(`   - ${templates.length} templates`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

// Executar verificação
checkTemplatesData();