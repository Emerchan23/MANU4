const mysql = require('mysql2/promise');

async function checkIndexes() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'sis_manutencao'
    });

    console.log('=== VERIFICAÇÃO DE ÍNDICES DE PERFORMANCE ===\n');

    // Verificar índices nas tabelas principais
    const tabelas = ['equipment', 'service_orders', 'empresas', 'users', 'notifications'];
    
    for (const tabela of tabelas) {
      try {
        console.log(`📊 ÍNDICES DA TABELA: ${tabela.toUpperCase()}`);
        const [indexes] = await connection.execute(`SHOW INDEX FROM ${tabela}`);
        
        if (indexes.length > 0) {
          indexes.forEach(idx => {
            const keyType = idx.Key_name === 'PRIMARY' ? '🔑 PRIMARY' : 
                           idx.Non_unique === 0 ? '🔒 UNIQUE' : '📇 INDEX';
            console.log(`  ${keyType}: ${idx.Key_name} (${idx.Column_name})`);
          });
        } else {
          console.log('  ❌ Nenhum índice encontrado');
        }
        console.log('');
      } catch (err) {
        console.log(`  ❌ Tabela ${tabela} não encontrada\n`);
      }
    }

    // Verificar queries lentas potenciais
    console.log('=== ANÁLISE DE PERFORMANCE ===');
    
    // Verificar se há índices em foreign keys importantes
    const fkChecks = [
      { table: 'equipment', column: 'sector_id', desc: 'FK para setores' },
      { table: 'equipment', column: 'category_id', desc: 'FK para categorias' },
      { table: 'service_orders', column: 'equipment_id', desc: 'FK para equipamentos' },
      { table: 'service_orders', column: 'company_id', desc: 'FK para empresas' },
      { table: 'users', column: 'email', desc: 'Login de usuários' }
    ];

    for (const check of fkChecks) {
      try {
        const [indexes] = await connection.execute(`
          SHOW INDEX FROM ${check.table} WHERE Column_name = '${check.column}'
        `);
        
        if (indexes.length > 0) {
          console.log(`✅ ${check.desc}: INDEXADO`);
        } else {
          console.log(`❌ ${check.desc}: SEM ÍNDICE`);
        }
      } catch (err) {
        console.log(`❌ ${check.desc}: ERRO NA VERIFICAÇÃO`);
      }
    }

    console.log('');

    // Verificar tamanho das tabelas
    console.log('=== TAMANHO DAS TABELAS ===');
    const [sizes] = await connection.execute(`
      SELECT 
        table_name,
        table_rows,
        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size_MB'
      FROM information_schema.tables 
      WHERE table_schema = 'sis_manutencao'
      AND table_rows > 0
      ORDER BY (data_length + index_length) DESC
      LIMIT 10
    `);

    sizes.forEach(table => {
      console.log(`📊 ${table.table_name}: ${table.table_rows} registros, ${table.Size_MB} MB`);
    });

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkIndexes();