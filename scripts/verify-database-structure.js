import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Carregar variáveis de ambiente
dotenv.config();

async function verifyDatabaseStructure() {
  console.log('🔍 Verificando estrutura atual do banco de dados...');
  
  let connection;
  
  try {
    // Configuração do banco de dados
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
      port: process.env.DB_PORT || 3306
    };

    console.log(`📍 Conectando ao banco: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
    
    // Conectar ao banco
    connection = await mysql.createConnection(dbConfig);
    
    // Verificar tabelas principais para migração
    const tablesToCheck = ['maintenance_types', 'template_categories', 'companies', 'sectors'];
    
    console.log('\n📊 Verificando estrutura das tabelas principais:\n');
    
    for (const tableName of tablesToCheck) {
      console.log(`\n🔍 Tabela: ${tableName}`);
      console.log('=' .repeat(50));
      
      try {
        // Verificar se a tabela existe
        const [tableExists] = await connection.execute(
          `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`,
          [dbConfig.database, tableName]
        );
        
        if (tableExists[0].count === 0) {
          console.log(`❌ Tabela ${tableName} não existe`);
          continue;
        }
        
        console.log(`✅ Tabela ${tableName} existe`);
        
        // Obter estrutura da tabela
        const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
        console.log('\n📋 Estrutura:');
        columns.forEach(col => {
          console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? col.Key : ''} ${col.Default !== null ? `DEFAULT ${col.Default}` : ''}`);
        });
        
        // Contar registros
        const [count] = await connection.execute(`SELECT COUNT(*) as total FROM ${tableName}`);
        console.log(`\n📊 Total de registros: ${count[0].total}`);
        
        // Mostrar alguns dados de exemplo
        if (count[0].total > 0) {
          const [sample] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 3`);
          console.log('\n📄 Dados de exemplo:');
          sample.forEach((row, index) => {
            console.log(`  ${index + 1}. ${JSON.stringify(row, null, 2)}`);
          });
        }
        
      } catch (error) {
        console.log(`❌ Erro ao verificar tabela ${tableName}: ${error.message}`);
      }
    }
    
    // Verificar se já existem tabelas em português
    console.log('\n\n🔍 Verificando se já existem tabelas em português:\n');
    
    const portugueseTables = ['tipos_manutencao', 'categorias_templates', 'empresas', 'setores'];
    
    for (const tableName of portugueseTables) {
      try {
        const [tableExists] = await connection.execute(
          `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`,
          [dbConfig.database, tableName]
        );
        
        if (tableExists[0].count > 0) {
          console.log(`⚠️  Tabela ${tableName} já existe!`);
          const [count] = await connection.execute(`SELECT COUNT(*) as total FROM ${tableName}`);
          console.log(`   📊 Total de registros: ${count[0].total}`);
        } else {
          console.log(`✅ Tabela ${tableName} não existe (pronta para criação)`);
        }
      } catch (error) {
        console.log(`❌ Erro ao verificar tabela ${tableName}: ${error.message}`);
      }
    }
    
    console.log('\n✅ Verificação de estrutura concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar verificação se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyDatabaseStructure()
    .then(() => {
      console.log('\n🎉 Verificação concluída com sucesso!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Falha na verificação:', error);
      process.exit(1);
    });
}

export default verifyDatabaseStructure;