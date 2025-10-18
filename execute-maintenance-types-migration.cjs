const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function executeMigration() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados MariaDB');
    
    // Ler o arquivo SQL
    const sqlFile = path.join(__dirname, 'create-maintenance-types-table.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Dividir o conteúdo em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.match(/^--.*/));
    
    console.log(`\n📋 Executando ${commands.length} comandos SQL...\n`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      try {
        console.log(`${i + 1}. Executando: ${command.substring(0, 50)}...`);
        
        const [result] = await connection.execute(command);
        
        // Se for um SELECT, mostrar os resultados
        if (command.toUpperCase().startsWith('SELECT')) {
          if (Array.isArray(result) && result.length > 0) {
            console.log('   Resultado:', result);
          }
        } else if (command.toUpperCase().startsWith('DESCRIBE')) {
          if (Array.isArray(result) && result.length > 0) {
            console.log('   Estrutura da tabela:');
            result.forEach(col => {
              console.log(`     - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
            });
          }
        } else if (command.toUpperCase().startsWith('INSERT')) {
          console.log(`   ✅ ${result.affectedRows} registro(s) inserido(s)`);
        } else if (command.toUpperCase().startsWith('CREATE')) {
          console.log('   ✅ Tabela criada com sucesso');
        } else if (command.toUpperCase().startsWith('ALTER')) {
          console.log('   ✅ Tabela alterada com sucesso');
        }
        
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log('   ⚠️  Registro já existe (ignorado)');
        } else if (error.code === 'ER_DUP_KEYNAME') {
          console.log('   ⚠️  Chave estrangeira já existe (ignorado)');
        } else if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log('   ⚠️  Tabela já existe (ignorado)');
        } else {
          console.log(`   ❌ Erro: ${error.message}`);
        }
      }
    }
    
    console.log('\n🎉 Migração concluída!');
    
    // Verificar se tudo foi criado corretamente
    console.log('\n📊 Verificando resultado final...');
    
    // Verificar tabela maintenance_types
    try {
      const [types] = await connection.execute('SELECT COUNT(*) as total FROM maintenance_types');
      console.log(`✅ Tabela maintenance_types: ${types[0].total} registros`);
      
      const [activeTypes] = await connection.execute('SELECT id, name FROM maintenance_types WHERE isActive = 1');
      console.log('Tipos ativos:');
      activeTypes.forEach(type => {
        console.log(`  - ID: ${type.id}, Nome: ${type.name}`);
      });
    } catch (error) {
      console.log('❌ Erro ao verificar maintenance_types:', error.message);
    }
    
    // Verificar chave estrangeira
    try {
      const [foreignKeys] = await connection.execute(`
        SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'service_orders' 
          AND COLUMN_NAME = 'maintenance_type_id'
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `);
      
      if (foreignKeys.length > 0) {
        console.log('✅ Chave estrangeira maintenance_type_id criada com sucesso');
      } else {
        console.log('⚠️  Chave estrangeira maintenance_type_id não encontrada');
      }
    } catch (error) {
      console.log('❌ Erro ao verificar chave estrangeira:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

executeMigration();