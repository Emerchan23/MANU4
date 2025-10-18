import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'fs';

// Carregar variáveis de ambiente
dotenv.config();

async function applySQLCorrections() {
  console.log('🔧 Aplicando correções SQL do arquivo deprecated-AUDITORIA_OS_CORRECOES_DDL.sql...');
  
  // Configuração do banco
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_maintenance',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    timezone: '+00:00'
  };
  
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco MariaDB');
    
    // Aplicar correções essenciais uma por uma
    console.log('\n📋 Aplicando correções essenciais...');
    
    // 1. Verificar estrutura atual da tabela service_orders
    console.log('\n1. 🔍 Verificando estrutura atual da tabela service_orders...');
    const [currentStructure] = await connection.execute('DESCRIBE service_orders');
    console.log('   Colunas atuais:');
    currentStructure.forEach(col => {
      console.log(`     - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
    });
    
    // 2. Aplicar correções de ENUM para priority (se necessário)
    console.log('\n2. 🔧 Verificando e corrigindo ENUM de priority...');
    try {
      await connection.execute(`
        ALTER TABLE service_orders 
        MODIFY COLUMN priority ENUM('BAIXA','MEDIA','ALTA','CRITICA') NOT NULL DEFAULT 'MEDIA'
      `);
      console.log('   ✅ ENUM de priority atualizado');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME' || error.message.includes('Duplicate')) {
        console.log('   ℹ️  ENUM de priority já está correto');
      } else {
        console.log(`   ⚠️  Erro ao atualizar priority: ${error.message}`);
      }
    }
    
    // 3. Aplicar correções de ENUM para status (se necessário)
    console.log('\n3. 🔧 Verificando e corrigindo ENUM de status...');
    try {
      await connection.execute(`
        ALTER TABLE service_orders 
        MODIFY COLUMN status ENUM('ABERTA','EM_ANDAMENTO','AGUARDANDO_APROVACAO','APROVADA','REJEITADA','CONCLUIDA','CANCELADA') NOT NULL DEFAULT 'ABERTA'
      `);
      console.log('   ✅ ENUM de status atualizado');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME' || error.message.includes('Duplicate')) {
        console.log('   ℹ️  ENUM de status já está correto');
      } else {
        console.log(`   ⚠️  Erro ao atualizar status: ${error.message}`);
      }
    }
    
    // 4. Ajustar tipo de dados para custo
    console.log('\n4. 🔧 Ajustando tipo de dados para custo...');
    try {
      await connection.execute(`
        ALTER TABLE service_orders 
        MODIFY COLUMN cost DECIMAL(12,2) UNSIGNED NULL DEFAULT NULL
      `);
      console.log('   ✅ Tipo de dados do custo atualizado');
    } catch (error) {
      console.log(`   ⚠️  Erro ao atualizar custo: ${error.message}`);
    }
    
    // 5. Adicionar constraint para validação de custo (se não existir)
    console.log('\n5. 🔧 Adicionando constraint para validação de custo...');
    try {
      await connection.execute(`
        ALTER TABLE service_orders 
        ADD CONSTRAINT chk_cost_positive CHECK (cost >= 0)
      `);
      console.log('   ✅ Constraint de custo adicionada');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME' || error.message.includes('Duplicate')) {
        console.log('   ℹ️  Constraint de custo já existe');
      } else {
        console.log(`   ⚠️  Erro ao adicionar constraint: ${error.message}`);
      }
    }
    
    // 6. Adicionar índices de performance (se não existirem)
    console.log('\n6. 🔧 Adicionando índices de performance...');
    
    const indexes = [
      { name: 'idx_service_orders_priority', column: 'priority' },
      { name: 'idx_service_orders_requested_date', column: 'requested_date' },
      { name: 'idx_service_orders_status_priority', column: 'status, priority' },
      { name: 'idx_service_orders_equipment_status', column: 'equipment_id, status' }
    ];
    
    for (const index of indexes) {
      try {
        await connection.execute(`CREATE INDEX ${index.name} ON service_orders(${index.column})`);
        console.log(`   ✅ Índice ${index.name} criado`);
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME' || error.message.includes('Duplicate')) {
          console.log(`   ℹ️  Índice ${index.name} já existe`);
        } else {
          console.log(`   ⚠️  Erro ao criar índice ${index.name}: ${error.message}`);
        }
      }
    }
    
    // 7. Verificar se tabela maintenance_types existe
    console.log('\n7. 🔧 Verificando tabela maintenance_types...');
    try {
      const [maintenanceTypesCheck] = await connection.execute('SELECT COUNT(*) as count FROM maintenance_types LIMIT 1');
      console.log('   ✅ Tabela maintenance_types já existe');
      
      // Inserir tipos básicos se não existirem
      await connection.execute(`
        INSERT IGNORE INTO maintenance_types (name, description) VALUES 
        ('PREVENTIVA', 'Manutenção preventiva programada'),
        ('CORRETIVA', 'Manutenção corretiva para reparo'),
        ('PREDITIVA', 'Manutenção baseada em condição')
      `);
      console.log('   ✅ Tipos básicos de manutenção verificados/inseridos');
      
    } catch (error) {
      console.log('   📝 Criando tabela maintenance_types...');
      try {
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS maintenance_types (
              id INT(11) NOT NULL AUTO_INCREMENT,
              name VARCHAR(100) NOT NULL,
              description TEXT NULL,
              is_active BOOLEAN NOT NULL DEFAULT TRUE,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (id),
              UNIQUE KEY uk_maintenance_types_name (name)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ Tabela maintenance_types criada');
        
        await connection.execute(`
          INSERT INTO maintenance_types (name, description) VALUES 
          ('PREVENTIVA', 'Manutenção preventiva programada'),
          ('CORRETIVA', 'Manutenção corretiva para reparo'),
          ('PREDITIVA', 'Manutenção baseada em condição')
        `);
        console.log('   ✅ Tipos básicos de manutenção inseridos');
      } catch (createError) {
        console.log(`   ⚠️  Erro ao criar tabela maintenance_types: ${createError.message}`);
      }
    }
    
    // 8. Verificar estrutura final
    console.log('\n8. 📊 Verificando estrutura final...');
    const [finalStructure] = await connection.execute('DESCRIBE service_orders');
    console.log('   Estrutura final da tabela service_orders:');
    finalStructure.forEach(col => {
      console.log(`     - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(NULL)'} ${col.Key ? `[${col.Key}]` : ''}`);
    });
    
    // 9. Verificar índices
    console.log('\n9. 📊 Verificando índices criados...');
    const [indexesResult] = await connection.execute(`
      SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'service_orders'
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `, [process.env.DB_NAME || 'hospital_maintenance']);
    
    console.log('   Índices na tabela service_orders:');
    indexesResult.forEach(idx => {
      console.log(`     - ${idx.INDEX_NAME}: ${idx.COLUMN_NAME} ${idx.NON_UNIQUE ? '(não único)' : '(único)'}`);
    });
    
    console.log('\n✅ Correções SQL aplicadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao aplicar correções SQL:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

// Executar aplicação das correções
applySQLCorrections().catch(console.error);