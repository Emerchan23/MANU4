const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function createNotificationsTables() {
  let connection;
  
  try {
    console.log('🔍 Criando tabelas de notificações...\n');

    // Conectar ao banco de dados
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('✅ Conectado ao banco de dados');

    // Ler o arquivo SQL
    const sqlFile = path.join(__dirname, '..', 'database', 'migrations', 'create_notifications_tables.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Dividir o conteúdo em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Executando ${commands.length} comandos SQL...\n`);

    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command) {
        try {
          console.log(`Executando comando ${i + 1}/${commands.length}...`);
          await connection.execute(command);
          console.log('✅ Comando executado com sucesso');
        } catch (error) {
          console.log(`⚠️  Erro no comando ${i + 1}: ${error.message}`);
          // Continuar com os próximos comandos mesmo se houver erro
        }
      }
    }

    // Verificar se as tabelas foram criadas
    console.log('\n🔍 Verificando tabelas criadas...');
    
    const tables = ['notifications', 'push_subscriptions', 'notification_settings'];
    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SHOW TABLES LIKE '${table}'`);
        if (rows.length > 0) {
          console.log(`✅ Tabela '${table}' criada com sucesso`);
          
          // Mostrar estrutura da tabela
          const [structure] = await connection.execute(`DESCRIBE ${table}`);
          console.log(`   Colunas: ${structure.map(col => col.Field).join(', ')}`);
        } else {
          console.log(`❌ Tabela '${table}' não foi criada`);
        }
      } catch (error) {
        console.log(`❌ Erro ao verificar tabela '${table}': ${error.message}`);
      }
    }

    console.log('\n🎉 Migração de notificações concluída!');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar a migração
createNotificationsTables();