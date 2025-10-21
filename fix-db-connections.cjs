const mysql = require('mysql2/promise');

// Script para diagnosticar e corrigir problemas de conexões no MariaDB

async function diagnoseAndFix() {
  console.log('🔍 Diagnosticando problemas de conexão no MariaDB...');
  
  let connection;
  
  try {
    // Tentar conexão simples sem pool
    console.log('🔗 Tentando conexão direta...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance'
    });
    
    console.log('✅ Conexão direta estabelecida!');
    
    // Verificar conexões ativas
    console.log('📊 Verificando conexões ativas...');
    const [processlist] = await connection.query('SHOW PROCESSLIST');
    console.log(`📊 Total de conexões ativas: ${processlist.length}`);
    
    // Mostrar detalhes das conexões
    console.log('📋 Detalhes das conexões:');
    processlist.forEach((proc, index) => {
      if (index < 10) { // Mostrar apenas as primeiras 10
        console.log(`  ${proc.Id}: ${proc.User}@${proc.Host} - ${proc.Command} - ${proc.Time}s - ${proc.State || 'N/A'}`);
      }
    });
    
    if (processlist.length > 10) {
      console.log(`  ... e mais ${processlist.length - 10} conexões`);
    }
    
    // Verificar configurações do servidor
    console.log('⚙️ Verificando configurações do servidor...');
    const [maxConnections] = await connection.query("SHOW VARIABLES LIKE 'max_connections'");
    console.log(`⚙️ Máximo de conexões permitidas: ${maxConnections[0].Value}`);
    
    const [threadsConnected] = await connection.query("SHOW STATUS LIKE 'Threads_connected'");
    console.log(`⚙️ Conexões atualmente conectadas: ${threadsConnected[0].Value}`);
    
    const [maxUsedConnections] = await connection.query("SHOW STATUS LIKE 'Max_used_connections'");
    console.log(`⚙️ Máximo de conexões já utilizadas: ${maxUsedConnections[0].Value}`);
    
    // Verificar conexões idle/sleeping
    const sleepingConnections = processlist.filter(proc => proc.Command === 'Sleep');
    console.log(`😴 Conexões idle/sleeping: ${sleepingConnections.length}`);
    
    // Matar conexões idle antigas (mais de 5 minutos)
    console.log('🧹 Limpando conexões idle antigas...');
    let killedCount = 0;
    
    for (const proc of sleepingConnections) {
      if (proc.Time > 300 && proc.User !== 'root') { // Mais de 5 minutos e não é root
        try {
          await connection.query(`KILL ${proc.Id}`);
          killedCount++;
          console.log(`💀 Matou conexão idle: ${proc.Id} (${proc.Time}s idle)`);
        } catch (killError) {
          console.log(`⚠️ Não foi possível matar conexão ${proc.Id}: ${killError.message}`);
        }
      }
    }
    
    console.log(`🧹 Total de conexões idle removidas: ${killedCount}`);
    
    // Verificar novamente após limpeza
    console.log('🔄 Verificando status após limpeza...');
    const [newProcesslist] = await connection.query('SHOW PROCESSLIST');
    console.log(`📊 Conexões ativas após limpeza: ${newProcesslist.length}`);
    
    const [newThreadsConnected] = await connection.query("SHOW STATUS LIKE 'Threads_connected'");
    console.log(`⚙️ Threads conectadas após limpeza: ${newThreadsConnected[0].Value}`);
    
    // Sugestões de otimização
    console.log('\n💡 SUGESTÕES DE OTIMIZAÇÃO:');
    
    if (parseInt(threadsConnected[0].Value) > parseInt(maxConnections[0].Value) * 0.8) {
      console.log('⚠️ Uso de conexões está alto (>80%). Considere:');
      console.log('   - Aumentar max_connections no MariaDB');
      console.log('   - Reduzir connectionLimit na aplicação');
      console.log('   - Implementar connection pooling mais eficiente');
    }
    
    if (sleepingConnections.length > 10) {
      console.log('⚠️ Muitas conexões idle. Considere:');
      console.log('   - Reduzir wait_timeout no MariaDB');
      console.log('   - Implementar auto-close de conexões idle');
    }
    
    console.log('\n🎯 CONFIGURAÇÕES RECOMENDADAS PARA MARIADB:');
    console.log('   max_connections = 200');
    console.log('   wait_timeout = 300');
    console.log('   interactive_timeout = 300');
    console.log('   max_connect_errors = 100');
    
    console.log('\n🎯 CONFIGURAÇÕES RECOMENDADAS PARA A APLICAÇÃO:');
    console.log('   connectionLimit: 5-10');
    console.log('   acquireTimeout: 60000');
    console.log('   idleTimeout: 300000');
    console.log('   maxIdle: 3-5');
    
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error.message);
    console.error('❌ Código:', error.code);
    
    if (error.code === 'ER_CON_COUNT_ERROR') {
      console.log('\n🚨 PROBLEMA IDENTIFICADO: Muitas conexões!');
      console.log('💡 SOLUÇÕES IMEDIATAS:');
      console.log('   1. Reiniciar o MariaDB para limpar conexões');
      console.log('   2. Aumentar max_connections no MariaDB');
      console.log('   3. Reduzir connectionLimit na aplicação');
      console.log('   4. Implementar limpeza automática de conexões idle');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔚 Conexão de diagnóstico fechada');
    }
  }
}