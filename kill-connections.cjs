const mysql = require('mysql2/promise');

async function killConnections() {
  console.log('🔥 Forçando limpeza de conexões MariaDB...');
  
  let connection;
  
  try {
    // Tentar conexão como root com privilégios administrativos
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      connectTimeout: 5000
    });
    
    console.log('✅ Conectado como administrador');
    
    // Listar todas as conexões
    const [processlist] = await connection.query('SHOW PROCESSLIST');
    console.log(`📊 Total de conexões encontradas: ${processlist.length}`);
    
    let killedCount = 0;
    
    // Matar todas as conexões que não são do root atual
    for (const proc of processlist) {
      // Não matar a própria conexão e conexões do sistema
      if (proc.Id !== connection.threadId && 
          proc.User !== 'system user' && 
          proc.Command !== 'Binlog Dump') {
        
        try {
          await connection.query(`KILL ${proc.Id}`);
          killedCount++;
          console.log(`💀 Matou conexão: ${proc.Id} (${proc.User}@${proc.Host} - ${proc.Command})`);
        } catch (killError) {
          console.log(`⚠️ Não foi possível matar ${proc.Id}: ${killError.message}`);
        }
      }
    }
    
    console.log(`🧹 Total de conexões removidas: ${killedCount}`);
    
    // Verificar status após limpeza
    const [newProcesslist] = await connection.query('SHOW PROCESSLIST');
    console.log(`📊 Conexões restantes: ${newProcesslist.length}`);
    
    // Mostrar configurações atuais
    const [maxConn] = await connection.query("SHOW VARIABLES LIKE 'max_connections'");
    console.log(`⚙️ Máximo de conexões: ${maxConn[0].Value}`);
    
    const [threadsConn] = await connection.query("SHOW STATUS LIKE 'Threads_connected'");
    console.log(`⚙️ Threads conectadas: ${threadsConn[0].Value}`);
    
    console.log('✅ Limpeza concluída! Tente conectar novamente.');
    
  } catch (error) {
    console.error('❌ Erro durante limpeza:', error.message);
    console.error('❌ Código:', error.code);
    
    if (error.code === 'ER_CON_COUNT_ERROR') {
      console.log('🚨 Ainda há muitas conexões. Pode ser necessário reiniciar o MariaDB.');
      console.log('💡 Execute: net stop mariadb && net start mariadb (como administrador)');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

killConnections();