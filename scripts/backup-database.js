import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config();

async function backupDatabase() {
  console.log('🔄 Iniciando backup do banco de dados...');
  
  let connection;
  
  try {
    // Configuração do banco de dados
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
      port: process.env.DB_PORT || 3306,
      charset: 'utf8mb4'
    };

    console.log(`📍 Conectando ao banco: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
    
    // Conectar ao banco
    connection = await mysql.createConnection(dbConfig);
    
    // Criar diretório de backup se não existir
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Nome do arquivo de backup com timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFile = path.join(backupDir, `backup_pre_migration_${timestamp}.sql`);
    
    console.log(`📁 Arquivo de backup: ${backupFile}`);
    
    // Obter lista de tabelas
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`📊 Encontradas ${tables.length} tabelas para backup`);
    
    let backupContent = `-- ============================================\n`;
    backupContent += `-- BACKUP DO BANCO DE DADOS - PRÉ MIGRAÇÃO\n`;
    backupContent += `-- Data: ${new Date().toLocaleString('pt-BR')}\n`;
    backupContent += `-- Banco: ${dbConfig.database}\n`;
    backupContent += `-- ============================================\n\n`;
    backupContent += `USE ${dbConfig.database};\n\n`;
    backupContent += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;
    
    // Fazer backup de cada tabela
    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      console.log(`📋 Fazendo backup da tabela: ${tableName}`);
      
      // Obter estrutura da tabela
      const [createTable] = await connection.execute(`SHOW CREATE TABLE \`${tableName}\``);
      const createTableSQL = createTable[0]['Create Table'];
      
      backupContent += `-- Estrutura da tabela ${tableName}\n`;
      backupContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      backupContent += `${createTableSQL};\n\n`;
      
      // Obter dados da tabela
      const [rows] = await connection.execute(`SELECT * FROM \`${tableName}\``);
      
      if (rows.length > 0) {
        backupContent += `-- Dados da tabela ${tableName}\n`;
        backupContent += `INSERT INTO \`${tableName}\` VALUES\n`;
        
        const values = rows.map(row => {
          const rowValues = Object.values(row).map(value => {
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
            return value;
          });
          return `(${rowValues.join(', ')})`;
        });
        
        backupContent += values.join(',\n') + ';\n\n';
      }
    }
    
    backupContent += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    backupContent += `-- Backup concluído em ${new Date().toLocaleString('pt-BR')}\n`;
    
    // Salvar arquivo de backup
    fs.writeFileSync(backupFile, backupContent, 'utf8');
    
    console.log('✅ Backup concluído com sucesso!');
    console.log(`📁 Arquivo salvo em: ${backupFile}`);
    console.log(`📊 Tamanho do arquivo: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);
    
    return backupFile;
    
  } catch (error) {
    console.error('❌ Erro durante o backup:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar backup se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  backupDatabase()
    .then(backupFile => {
      console.log(`\n🎉 Backup realizado com sucesso: ${backupFile}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Falha no backup:', error);
      process.exit(1);
    });
}

export default backupDatabase;