const mysql = require('mysql2/promise');

async function killConnections() {
  try {
    console.log('🔄 Matando conexões ativas...');
    
    // Criar uma conexão simples para matar outras conexões
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance',
      port: 3306
    });

    console.log('✅ Conectado ao banco');

    // Listar processos ativos
    const [processes] = await connection.execute('SHOW PROCESSLIST');
    console.log('📊 Processos ativos:', processes.length);

    // Matar conexões que não são a atual
    for (const process of processes) {
      if (process.Id !== connection.threadId && process.Command !== 'Sleep') {
        try {
          await connection.execute(`KILL ${process.Id}`);
          console.log(`🔪 Matou processo ${process.Id}`);
        } catch (err) {
          console.log(`⚠️ Não foi possível matar processo ${process.Id}:`, err.message);
        }
      }
    }

    await connection.end();
    console.log('✅ Limpeza concluída');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

killConnections();