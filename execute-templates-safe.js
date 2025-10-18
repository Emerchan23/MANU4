import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function executeTemplatesSQL() {
  let connection;
  
  try {
    console.log('🔄 Iniciando execução do script de templates...');
    
    // Conectar ao banco de dados
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');
    
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, '04-create-templates-tables.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ Arquivo SQL não encontrado:', sqlFilePath);
      return;
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('📄 Arquivo SQL carregado com sucesso');
    
    // Dividir o SQL em statements individuais
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Encontrados ${statements.length} statements para executar`);
    
    // Executar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        try {
          console.log(`⚡ Executando statement ${i + 1}/${statements.length}...`);
          await connection.execute(statement);
          console.log(`✅ Statement ${i + 1} executado com sucesso`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`⚠️ Statement ${i + 1}: Tabela já existe (ignorando)`);
          } else {
            console.error(`❌ Erro no statement ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }
    
    // Verificar se as tabelas foram criadas
    console.log('🔍 Verificando tabelas criadas...');
    
    const [tables] = await connection.execute("SHOW TABLES LIKE '%template%'");
    console.log('📋 Tabelas de templates encontradas:', tables.length);
    
    if (tables.length > 0) {
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`  ✅ ${tableName}`);
      });
    }
    
    // Verificar dados iniciais
    console.log('🔍 Verificando dados iniciais...');
    
    try {
      const [categories] = await connection.execute('SELECT COUNT(*) as count FROM template_categories');
      console.log(`📊 Categorias de templates: ${categories[0].count}`);
      
      const [templates] = await connection.execute('SELECT COUNT(*) as count FROM service_description_templates');
      console.log(`📊 Templates de descrição: ${templates[0].count}`);
    } catch (error) {
      console.log('⚠️ Não foi possível verificar dados iniciais:', error.message);
    }
    
    console.log('🎉 Script executado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão com banco de dados fechada');
    }
  }
}

// Executar o script
executeTemplatesSQL();