import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function migrationStep1() {
  console.log('🚀 Iniciando Migração - Etapa 1: Criação da tabela log_migracao e tipos_manutencao');
  
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
    
    // 1. Criar tabela de log de migração
    console.log('\n📋 Criando tabela log_migracao...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS log_migracao (
        id INT AUTO_INCREMENT PRIMARY KEY,
        etapa VARCHAR(100),
        status ENUM('iniciado', 'concluido', 'erro'),
        mensagem TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Tabela log_migracao criada');
    
    // Log inicial
    await connection.execute(`
      INSERT INTO log_migracao (etapa, status, mensagem) 
      VALUES ('INICIO_MIGRACAO', 'iniciado', 'Iniciando migração para português brasileiro')
    `);
    
    // 2. Criar tabela tipos_manutencao
    console.log('\n📋 Criando tabela tipos_manutencao...');
    
    await connection.execute(`
      DROP TABLE IF EXISTS tipos_manutencao
    `);
    
    await connection.execute(`
      CREATE TABLE tipos_manutencao (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        categoria ENUM('preventiva','corretiva','calibracao','instalacao','desinstalacao','consultoria'),
        ativo BOOLEAN DEFAULT TRUE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_nome (nome),
        INDEX idx_ativo (ativo),
        INDEX idx_categoria (categoria)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Tipos de manutenção do sistema'
    `);
    
    console.log('✅ Tabela tipos_manutencao criada');
    
    await connection.execute(`
      INSERT INTO log_migracao (etapa, status, mensagem) 
      VALUES ('CRIAR_TIPOS_MANUTENCAO', 'concluido', 'Tabela tipos_manutencao criada')
    `);
    
    // 3. Migrar dados de maintenance_types para tipos_manutencao
    console.log('\n📋 Migrando dados de maintenance_types para tipos_manutencao...');
    
    await connection.execute(`
      INSERT INTO tipos_manutencao (id, nome, descricao, categoria, ativo, criado_em, atualizado_em)
      SELECT 
        id, 
        name as nome, 
        description as descricao,
        category as categoria,
        is_active as ativo, 
        created_at as criado_em, 
        updated_at as atualizado_em
      FROM maintenance_types
    `);
    
    // Verificar migração
    const [countAntigo] = await connection.execute('SELECT COUNT(*) as count FROM maintenance_types');
    const [countNovo] = await connection.execute('SELECT COUNT(*) as count FROM tipos_manutencao');
    
    console.log(`📊 Registros migrados: ${countNovo[0].count} de ${countAntigo[0].count}`);
    
    if (countAntigo[0].count === countNovo[0].count) {
      console.log('✅ Migração de dados concluída com sucesso!');
      
      await connection.execute(`
        INSERT INTO log_migracao (etapa, status, mensagem) 
        VALUES ('MIGRAR_TIPOS_MANUTENCAO', 'concluido', 
                CONCAT('Migrados: ', ?, ' de ', ?, ' registros'))
      `, [countNovo[0].count, countAntigo[0].count]);
      
      // Mostrar dados migrados
      console.log('\n📄 Dados migrados:');
      const [migrated] = await connection.execute('SELECT * FROM tipos_manutencao');
      migrated.forEach((row, i) => {
        console.log(`  ${i + 1}. ID: ${row.id}, Nome: ${row.nome}, Categoria: ${row.categoria}, Ativo: ${row.ativo}`);
      });
      
    } else {
      throw new Error(`Erro na migração: esperado ${countAntigo[0].count} registros, migrado ${countNovo[0].count}`);
    }
    
    console.log('\n🎉 Etapa 1 da migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    
    if (connection) {
      await connection.execute(`
        INSERT INTO log_migracao (etapa, status, mensagem) 
        VALUES ('ERRO_MIGRACAO', 'erro', ?)
      `, [error.message]);
    }
    
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar migração se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  migrationStep1()
    .then(() => {
      console.log('\n✅ Migração Etapa 1 concluída!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Falha na migração:', error);
      process.exit(1);
    });
}

export default migrationStep1;