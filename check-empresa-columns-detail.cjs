const mysql = require('mysql2/promise');

async function checkEmpresaColumnsDetail() {
  let connection;
  
  try {
    // Configuração do banco de dados
    const dbConfig = {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance',
      port: 3306
    };

    console.log('🔍 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Conectado ao banco de dados');
    
    // Verificar detalhes das colunas encontradas
    const tablesToCheck = [
      { table: 'preventive_maintenances', columns: ['assigned_company_id', 'assigned_company_name'] },
      { table: 'service_orders', columns: ['company_id'] }
    ];
    
    for (const tableInfo of tablesToCheck) {
      console.log(`\n📊 === VERIFICANDO TABELA: ${tableInfo.table} ===`);
      
      // Verificar estrutura completa da tabela
      console.log('\n🏗️  Estrutura da tabela:');
      const [structure] = await connection.execute(`DESCRIBE ${tableInfo.table}`);
      structure.forEach(col => {
        const isEmpresaColumn = tableInfo.columns.includes(col.Field);
        const marker = isEmpresaColumn ? '⚠️ ' : '   ';
        console.log(`${marker}${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} - Default: ${col.Default || 'NULL'}`);
      });
      
      // Verificar dados nas colunas de empresa
      for (const column of tableInfo.columns) {
        console.log(`\n🔍 Verificando coluna: ${column}`);
        
        try {
          // Contar registros totais
          const [totalCount] = await connection.execute(`SELECT COUNT(*) as total FROM ${tableInfo.table}`);
          console.log(`   📊 Total de registros na tabela: ${totalCount[0].total}`);
          
          // Contar registros com valor não nulo na coluna de empresa
          const [nonNullCount] = await connection.execute(
            `SELECT COUNT(*) as count FROM ${tableInfo.table} WHERE ${column} IS NOT NULL AND ${column} != ''`
          );
          console.log(`   📊 Registros com ${column} preenchido: ${nonNullCount[0].count}`);
          
          // Mostrar alguns valores únicos se existirem
          if (nonNullCount[0].count > 0) {
            const [sampleValues] = await connection.execute(
              `SELECT DISTINCT ${column} FROM ${tableInfo.table} WHERE ${column} IS NOT NULL AND ${column} != '' LIMIT 5`
            );
            console.log(`   📋 Valores únicos encontrados (amostra):`);
            sampleValues.forEach((row, index) => {
              console.log(`      ${index + 1}. ${row[column]}`);
            });
          }
          
        } catch (error) {
          console.log(`   ❌ Erro ao verificar coluna ${column}: ${error.message}`);
        }
      }
    }
    
    // Verificar se há foreign keys relacionadas a empresas
    console.log('\n🔗 Verificando foreign keys relacionadas a empresas...');
    
    const [foreignKeys] = await connection.execute(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM 
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE 
        REFERENCED_TABLE_SCHEMA = 'hospital_maintenance'
        AND (
          COLUMN_NAME LIKE '%company%' 
          OR COLUMN_NAME LIKE '%empresa%'
          OR REFERENCED_TABLE_NAME LIKE '%company%'
          OR REFERENCED_TABLE_NAME LIKE '%empresa%'
        )
    `);
    
    if (foreignKeys.length > 0) {
      console.log('\n⚠️  FOREIGN KEYS RELACIONADAS A EMPRESAS ENCONTRADAS:');
      foreignKeys.forEach((fk, index) => {
        console.log(`${index + 1}. Tabela: ${fk.TABLE_NAME} | Coluna: ${fk.COLUMN_NAME} | Referencia: ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    } else {
      console.log('\n✅ Nenhuma foreign key relacionada a empresas encontrada');
    }
    
    // Verificar se existem índices relacionados a empresas
    console.log('\n📇 Verificando índices relacionados a empresas...');
    
    for (const tableInfo of tablesToCheck) {
      console.log(`\n   Índices da tabela ${tableInfo.table}:`);
      const [indexes] = await connection.execute(`SHOW INDEX FROM ${tableInfo.table}`);
      
      const empresaIndexes = indexes.filter(idx => 
        tableInfo.columns.some(col => idx.Column_name === col)
      );
      
      if (empresaIndexes.length > 0) {
        empresaIndexes.forEach(idx => {
          console.log(`   ⚠️  Índice: ${idx.Key_name} | Coluna: ${idx.Column_name} | Tipo: ${idx.Index_type}`);
        });
      } else {
        console.log(`   ✅ Nenhum índice relacionado a empresas encontrado`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com o banco de dados fechada');
    }
  }
}

// Executar a verificação
checkEmpresaColumnsDetail().catch(console.error);