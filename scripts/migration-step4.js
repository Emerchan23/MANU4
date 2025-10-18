import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function migrationStep4() {
  console.log('🚀 Iniciando Migração - Etapa 4: sectors → setores');
  
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
      port: process.env.DB_PORT || 3306
    });
    
    console.log('✅ Conectado ao banco de dados');
    
    // Log início da etapa
    await connection.execute(`
      INSERT INTO log_migracao (etapa, status, mensagem) 
      VALUES ('INICIO_ETAPA_4', 'iniciado', 'Iniciando migração sectors → setores')
    `);
    
    // 1. Verificar estrutura da tabela original
    console.log('\n📋 Verificando tabela sectors...');
    
    const [originalStructure] = await connection.execute('DESCRIBE sectors');
    console.log('Estrutura original:');
    originalStructure.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    const [originalCount] = await connection.execute('SELECT COUNT(*) as count FROM sectors');
    console.log(`📊 Registros na tabela original: ${originalCount[0].count}`);
    
    // 2. Criar tabela setores
    console.log('\n📋 Criando tabela setores...');
    
    await connection.execute(`
      DROP TABLE IF EXISTS setores
    `);
    
    await connection.execute(`
      CREATE TABLE setores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        descricao TEXT,
        localizacao VARCHAR(255),
        responsavel VARCHAR(255),
        telefone VARCHAR(20),
        email VARCHAR(255),
        ativo BOOLEAN DEFAULT TRUE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_nome (nome),
        INDEX idx_responsavel (responsavel),
        INDEX idx_ativo (ativo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Setores do hospital'
    `);
    
    console.log('✅ Tabela setores criada');
    
    await connection.execute(`
      INSERT INTO log_migracao (etapa, status, mensagem) 
      VALUES ('CRIAR_SETORES', 'concluido', 'Tabela setores criada')
    `);
    
    // 3. Migrar dados de sectors para setores
    console.log('\n📋 Migrando dados de sectors para setores...');
    
    // Verificar se existem dados para migrar
    if (originalCount[0].count > 0) {
      await connection.execute(`
        INSERT INTO setores (id, nome, descricao, localizacao, responsavel, telefone, email, ativo, criado_em, atualizado_em)
        SELECT 
          id, 
          name as nome, 
          description as descricao,
          'N/A' as localizacao,
          manager_id as responsavel,
          'N/A' as telefone,
          'N/A' as email,
          COALESCE(active, 1) as ativo, 
          COALESCE(created_at, NOW()) as criado_em, 
          COALESCE(updated_at, NOW()) as atualizado_em
        FROM sectors
      `);
      
      // Verificar migração
      const [newCount] = await connection.execute('SELECT COUNT(*) as count FROM setores');
      
      console.log(`📊 Registros migrados: ${newCount[0].count} de ${originalCount[0].count}`);
      
      if (originalCount[0].count === newCount[0].count) {
        console.log('✅ Migração de dados concluída com sucesso!');
        
        await connection.execute(`
          INSERT INTO log_migracao (etapa, status, mensagem) 
          VALUES ('MIGRAR_SETORES', 'concluido', 
                  CONCAT('Migrados: ', ?, ' de ', ?, ' registros'))
        `, [newCount[0].count, originalCount[0].count]);
        
        // Mostrar dados migrados
        console.log('\n📄 Dados migrados:');
        const [migrated] = await connection.execute('SELECT * FROM setores LIMIT 10');
        migrated.forEach((row, i) => {
          console.log(`  ${i + 1}. ID: ${row.id}, Nome: ${row.nome}, Responsável: ${row.responsavel || 'N/A'}, Ativo: ${row.ativo}`);
        });
        
      } else {
        throw new Error(`Erro na migração: esperado ${originalCount[0].count} registros, migrado ${newCount[0].count}`);
      }
    } else {
      console.log('📝 Nenhum dado para migrar - tabela sectors está vazia');
      
      await connection.execute(`
        INSERT INTO log_migracao (etapa, status, mensagem) 
        VALUES ('MIGRAR_SETORES', 'concluido', 'Nenhum dado para migrar - tabela vazia')
      `);
    }
    
    console.log('\n🎉 Etapa 4 da migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    
    if (connection) {
      await connection.execute(`
        INSERT INTO log_migracao (etapa, status, mensagem) 
        VALUES ('ERRO_ETAPA_4', 'erro', ?)
      `, [error.message]);
    }
    
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar a migração
migrationStep4()
  .then(() => {
    console.log('\n✅ Migração Etapa 4 concluída!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Falha na migração:', error);
    process.exit(1);
  });