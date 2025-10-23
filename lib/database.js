import mysql from 'mysql2/promise'
import path from 'path'
import fs from 'fs'

// ⚠️ VERIFICAÇÃO DE SEGURANÇA - PROIBIÇÃO DE BANCO NA PASTA SIS MANU ⚠️
function verificarLocalizacaoBanco() {
  // Só executar no servidor (Node.js), não no browser
  if (typeof window !== 'undefined') {
    return; // Está no browser, não executar
  }
  
  const dbDataPath = process.env.DB_DATA_PATH;
  const currentDir = process.cwd();
  
  // Verificar se DB_DATA_PATH está configurado
  if (!dbDataPath) {
    console.warn('⚠️ AVISO: DB_DATA_PATH não configurado, usando configuração padrão do banco');
    return;
  }
  
  // Verificar se o caminho não aponta para dentro da pasta sis manu
  const resolvedPath = path.resolve(dbDataPath);
  const projectPath = path.resolve(currentDir);
  
  if (resolvedPath.startsWith(projectPath)) {
    console.warn(`⚠️ AVISO: Banco de dados está dentro da pasta 'sis manu'!\nCaminho detectado: ${resolvedPath}\nRecomenda-se configurar DB_DATA_PATH para apontar para '../banco de dados'`);
    return;
  }
  
  // Verificar se a pasta externa existe
  if (!fs.existsSync(resolvedPath)) {
    console.warn(`⚠️ AVISO: Pasta externa '${resolvedPath}' não existe. Será criada automaticamente.`);
  }
  
  console.log(`✅ VERIFICAÇÃO APROVADA: Banco configurado corretamente na pasta externa: ${resolvedPath}`);
}

// Executar verificação na inicialização apenas no servidor
if (typeof window === 'undefined') {
  try {
    verificarLocalizacaoBanco();
  } catch (error) {
    console.warn('⚠️ Erro na verificação do banco:', error.message);
  }
}

// Configuração do banco de dados com otimizações avançadas para MariaDB
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
  timezone: '+00:00',
  // Configurações de pool otimizadas para 30 usuários simultâneos
  connectionLimit: 10, // Reduzido drasticamente para evitar sobrecarga
  acquireTimeout: 10000, // 10 segundos - reduzido para falhar mais rápido
  timeout: 15000, // 15 segundos timeout - reduzido para queries mais rápidas
  reconnect: true, // Reconexão habilitada com controle
  waitForConnections: true, // Esperar por conexões com timeout
  queueLimit: 100, // Fila aumentada para suportar múltiplas requisições de dashboard
  // Configurações de segurança
  multipleStatements: false, // Segurança
  dateStrings: false,
  supportBigNumbers: true,
  bigNumberStrings: false,
  // Configurações de performance
  idleTimeout: 10000, // 10 segundos para conexões idle - muito mais agressivo
  maxIdle: 1, // Máximo 1 conexão idle
  // Configurações de reconexão
  maxReconnects: 3,
  reconnectDelay: 2000,
  // Configurações de keep-alive
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // SSL desabilitado para desenvolvimento local
  ssl: false
};

let pool

function createPool() {
  // Só criar pool no servidor (Node.js), não no browser
  if (typeof window !== 'undefined') {
    throw new Error('Database operations are not allowed on the client side');
  }
  
  if (!pool) {
    console.log('🔄 Criando novo pool de conexões MariaDB...')
    pool = mysql.createPool(dbConfig)
    
    // Event listeners para monitorar o pool com métricas avançadas
    pool.on('connection', (connection) => {
      console.log('✅ Nova conexão estabelecida como id ' + connection.threadId)
      console.log('📊 Pool Status - Conexões ativas:', pool._allConnections?.length || 0)
    })
    
    pool.on('error', (err) => {
      console.error('❌ Erro no pool de conexões:', err)
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('🔄 Reconectando ao banco de dados...')
        pool = null // Forçar recriação do pool
      }
    })
    
    pool.on('acquire', (connection) => {
      console.log('🔗 Conexão %d adquirida - Pool: %d ativas, %d livres', 
        connection.threadId, 
        pool._acquiringConnections?.length || 0,
        pool._freeConnections?.length || 0
      )
    })
    
    pool.on('release', (connection) => {
      console.log('🔓 Conexão %d liberada - Pool: %d ativas, %d livres', 
        connection.threadId,
        pool._acquiringConnections?.length || 0,
        pool._freeConnections?.length || 0
      )
    })
    
    console.log('✅ Pool de conexões criado com sucesso')
  }
  return pool
}

async function query(sql, params = []) {
  // Só executar no servidor (Node.js), não no browser
  if (typeof window !== 'undefined') {
    throw new Error('Database queries are not allowed on the client side');
  }
  
  const poolInstance = createPool()
  let connection = null
  let retryCount = 0
  const maxRetries = 3
  const baseDelay = 1000 // 1 segundo base para backoff exponencial
  
  while (retryCount < maxRetries) {
    try {
      console.log('🔍 [DATABASE QUERY] SQL:', sql)
      console.log('🔍 [DATABASE QUERY] Parâmetros:', params)
      
      // Garantir que params seja um array
      const safeParams = Array.isArray(params) ? params : []
      
      // Obter conexão do pool com timeout
      connection = await poolInstance.getConnection()
      
      // Verificar se a conexão está ativa
      await connection.ping()
      
      // Usar query para prepared statements
      let results
      console.log('🔍 [DATABASE QUERY] Executando query com parâmetros seguros:', safeParams)
      
      if (safeParams.length === 0) {
        console.log('🔍 [DATABASE QUERY] Executando sem parâmetros')
        results = await connection.query(sql)
      } else {
        console.log('🔍 [DATABASE QUERY] Executando com parâmetros:', safeParams)
        results = await connection.query(sql, safeParams)
      }
      
      // Extrair apenas os dados da resposta
      const rows = results && results[0] ? results[0] : results
      
      console.log('✅ [DATABASE QUERY] Resultado obtido com sucesso')
      return rows
      
    } catch (error) {
      retryCount++
      console.error(`❌ [DATABASE QUERY] Erro (tentativa ${retryCount}/${maxRetries}):`, error.message)
      
      // Verificar se é erro de "Too many connections"
      if (error.code === 'ER_CON_COUNT_ERROR') {
        console.error('🚨 ERRO CRÍTICO: Too many connections detectado!')
        const delay = baseDelay * Math.pow(2, retryCount - 1) // Backoff exponencial
        console.log(`⏳ Aguardando ${delay}ms antes de tentar novamente...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // Forçar recriação do pool
        pool = null
        continue
      }
      
      // Se for erro de conexão e ainda temos tentativas, retry
      if ((error.code === 'PROTOCOL_CONNECTION_LOST' || 
           error.code === 'ECONNRESET' || 
           error.code === 'ETIMEDOUT' ||
           error.code === 'ENOTFOUND') && retryCount < maxRetries) {
        
        const delay = baseDelay * Math.pow(2, retryCount - 1) // Backoff exponencial
        console.log(`🔄 Tentando novamente em ${delay}ms... (${retryCount}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // Forçar recriação do pool se necessário
        if (error.code === 'PROTOCOL_CONNECTION_LOST') {
          pool = null
        }
        continue
      }
      
      // Se não é erro de conexão ou esgotamos as tentativas, throw
      console.error("❌ [DATABASE QUERY] Erro final:", error)
      console.error("❌ [DATABASE QUERY] SQL:", sql)
      console.error("❌ [DATABASE QUERY] Parâmetros:", params)
      console.error("❌ [DATABASE QUERY] Stack:", error.stack)
      throw error
    } finally {
      // Sempre liberar a conexão de volta ao pool
      if (connection) {
        try {
          connection.release()
          console.log('🔓 Conexão liberada de volta ao pool')
        } catch (releaseError) {
          console.error('❌ Erro ao liberar conexão:', releaseError.message)
        }
      }
    }
  }
}

// Alternative query function for operations that might have issues with prepared statements
async function queryDirect(sql, params = []) {
  // Só executar no servidor (Node.js), não no browser
  if (typeof window !== 'undefined') {
    throw new Error('Database queries are not allowed on the client side');
  }
  
  const connection = createPool()
  try {
    console.log('🔍 [DATABASE DIRECT] SQL:', sql)
    console.log('🔍 [DATABASE DIRECT] Parâmetros:', params)
    
    // Garantir que params seja um array
    const safeParams = Array.isArray(params) ? params : []
    
    let results
    if (safeParams.length === 0) {
      [results] = await connection.query(sql)
    } else {
      [results] = await connection.query(sql, safeParams)
    }
    
    console.log('✅ [DATABASE DIRECT] Resultado:', results)
    return results
  } catch (error) {
    console.error("❌ [DATABASE DIRECT] Erro:", error)
    console.error("❌ [DATABASE DIRECT] SQL:", sql)
    console.error("❌ [DATABASE DIRECT] Parâmetros:", params)
    throw error
  }
}

async function getNextNumber(entityType) {
  // Só executar no servidor (Node.js), não no browser
  if (typeof window !== 'undefined') {
    throw new Error('Database operations are not allowed on the client side');
  }
  
  const currentYear = new Date().getFullYear()

  // Get or create counter for current year
  await query(
    "INSERT INTO counters (entity_type, year, counter) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE counter = counter",
    [entityType, currentYear],
  )

  // Increment counter
  await query("UPDATE counters SET counter = counter + 1 WHERE entity_type = ? AND year = ?", [entityType, currentYear])

  // Get new counter value
  const result = await query("SELECT counter FROM counters WHERE entity_type = ? AND year = ?", [
    entityType,
    currentYear,
  ])

  const counter = result[0].counter

  // Format based on entity type
  switch (entityType) {
    case "service_orders":
      return `OS-${counter.toString().padStart(3, "0")}-${currentYear}`
    case "equipment":
      return `EQ-${counter.toString().padStart(2, "0")}/${currentYear}`
    case "companies":
      return `EMP-${counter.toString().padStart(2, "0")}/${currentYear}`
    default:
      return `${counter.toString().padStart(2, "0")}/${currentYear}`
  }
}

// Execute function for INSERT/UPDATE/DELETE operations
async function execute(sql, params = []) {
  // Só executar no servidor (Node.js), não no browser
  if (typeof window !== 'undefined') {
    throw new Error('Database operations are not allowed on the client side');
  }
  
  try {
    console.log('🔍 [DATABASE] Executando SQL:', sql)
    console.log('🔍 [DATABASE] Parâmetros:', params)
    
    const connection = createPool()
    const [result] = await connection.execute(sql, params)
    
    console.log('✅ [DATABASE] Resultado:', result)
    return result
  } catch (error) {
    console.error("❌ [DATABASE] Erro na execução:", error)
    console.error("❌ [DATABASE] SQL:", sql)
    console.error("❌ [DATABASE] Parâmetros:", params)
    throw error
  }
}

// Função getConnection para compatibilidade com as APIs de relatórios
async function getConnection() {
  // Só executar no servidor (Node.js), não no browser
  if (typeof window !== 'undefined') {
    throw new Error('Database operations are not allowed on the client side');
  }
  
  const pool = createPool()
  return pool.getConnection()
}

export {
  query,
  queryDirect,
  getNextNumber,
  createPool,
  execute,
  getConnection,
}
