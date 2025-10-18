import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function migrationStep2() {
  console.log('🚀 Iniciando Migração - Etapa 2: template_categories → categorias_templates');
  
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
      VALUES ('INICIO_ETAPA_2', 'iniciado', 'Iniciando migração template_categories → categorias_templates')
    `);
    
    // 1. Verificar estrutura da tabela original
    console.log('\n📋 Verificando tabela template_categories...');
    
    const [originalStructure] = await connection.execute('DESCRIBE template_categories');
    console.log('Estrutura original:');
    originalStructure.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    const [originalCount] = await connection.execute('SELECT COUNT(*) as count FROM template_categories');
    console.log(`📊 Registros na tabela original: ${originalCount[0].count}`);
    
    // 2. Criar tabela categorias_templates
    console.log('\n📋 Criando tabela categorias_templates...');
    
    await connection.execute(`
      DROP TABLE IF EXISTS categorias_templates
    `);
    
    await connection.execute(`
      CREATE TABLE categorias_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        cor VARCHAR(7) DEFAULT '#3B82F6',
        icone VARCHAR(50) DEFAULT 'folder',
        ativo BOOLEAN DEFAULT TRUE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_nome (nome),
        INDEX idx_ativo (ativo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Categorias de templates de descrição de serviços'
    `);
    
    console.log('✅ Tabela categorias_templates criada');
    
    await connection.execute(`
      INSERT INTO log_migracao (etapa, status, mensagem) 
      VALUES ('CRIAR_CATEGORIAS_TEMPLATES', 'concluido', 'Tabela categorias_templates criada')
    `);
    
    // 3. Migrar dados de template_categories para categorias_templates
    console.log('\n📋 Migrando dados de template_categories para categorias_templates...');
    
    // Verificar se existem dados para migrar
    if (originalCount[0].count > 0) {
      await connection.execute(`
        INSERT INTO categorias_templates (id, nome, descricao, cor, icone, ativo, criado_em, atualizado_em)
        SELECT 
          id, 
          name as nome, 
          description as descricao,
          COALESCE(color, '#3B82F6') as cor,
          'folder' as icone,
          1 as ativo, 
          COALESCE(created_at, NOW()) as criado_em, 
          COALESCE(updated_at, NOW()) as atualizado_em
        FROM template_categories
      `);
      
      // Verificar migração
      const [newCount] = await connection.execute('SELECT COUNT(*) as count FROM categorias_templates');
      
      console.log(`📊 Registros migrados: ${newCount[0].count} de ${originalCount[0].count}`);
      
      if (originalCount[0].count === newCount[0].count) {
        console.log('✅ Migração de dados concluída com sucesso!');
        
        await connection.execute(`
          INSERT INTO log_migracao (etapa, status, mensagem) 
          VALUES ('MIGRAR_CATEGORIAS_TEMPLATES', 'concluido', 
                  CONCAT('Migrados: ', ?, ' de ', ?, ' registros'))
        `, [newCount[0].count, originalCount[0].count]);
        
        // Mostrar dados migrados
        console.log('\n📄 Dados migrados:');
        const [migrated] = await connection.execute('SELECT * FROM categorias_templates');
        migrated.forEach((row, i) => {
          console.log(`  ${i + 1}. ID: ${row.id}, Nome: ${row.nome}, Ativo: ${row.ativo}`);
        });
        
      } else {
        throw new Error(`Erro na migração: esperado ${originalCount[0].count} registros, migrado ${newCount[0].count}`);
      }
    } else {
      console.log('📝 Nenhum dado para migrar - tabela template_categories está vazia');
      
      await connection.execute(`
        INSERT INTO log_migracao (etapa, status, mensagem) 
        VALUES ('MIGRAR_CATEGORIAS_TEMPLATES', 'concluido', 'Nenhum dado para migrar - tabela vazia')
      `);
    }
    
    console.log('\n🎉 Etapa 2 da migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    
    if (connection) {
      await connection.execute(`
        INSERT INTO log_migracao (etapa, status, mensagem) 
        VALUES ('ERRO_ETAPA_2', 'erro', ?)
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
migrationStep2()
  .then(() => {
    console.log('\n✅ Migração Etapa 2 concluída!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Falha na migração:', error);
    process.exit(1);
  });