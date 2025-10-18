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
    throw new Error('❌ ERRO CRÍTICO: DB_DATA_PATH não configurado! O banco DEVE estar na pasta externa "banco de dados"');
  }
  
  // Verificar se o caminho não aponta para dentro da pasta sis manu
  const resolvedPath = path.resolve(dbDataPath);
  const projectPath = path.resolve(currentDir);
  
  if (resolvedPath.startsWith(projectPath)) {
    throw new Error(`❌ PROIBIÇÃO ABSOLUTA VIOLADA: Banco de dados não pode estar dentro da pasta 'sis manu'!\nCaminho detectado: ${resolvedPath}\nConfigure DB_DATA_PATH para apontar para '../banco de dados'`);
  }
  
  // Verificar se a pasta externa existe
  if (!fs.existsSync(resolvedPath)) {
    console.warn(`⚠️ AVISO: Pasta externa '${resolvedPath}' não existe. Será criada automaticamente.`);
  }
  
  console.log(`✅ VERIFICAÇÃO APROVADA: Banco configurado corretamente na pasta externa: ${resolvedPath}`);
}

// Executar verificação na inicialização apenas no servidor
if (typeof window === 'undefined') {
  verificarLocalizacaoBanco();
}

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00',
  connectionLimit: 3, // Reduzido de 5 para 3
  acquireTimeout: 10000, // Reduzido de 30000 para 10000
  timeout: 10000, // Reduzido de 30000 para 10000
  reconnect: true,
  idleTimeout: 30000, // Reduzido de 60000 para 30000
  maxIdle: 1, // Reduzido de 2 para 1
  waitForConnections: true,
  queueLimit: 0
};

let pool

function createPool() {
  // Só criar pool no servidor (Node.js), não no browser
  if (typeof window !== 'undefined') {
    throw new Error('Database operations are not allowed on the client side');
  }
  
  if (!pool) {
    pool = mysql.createPool(dbConfig)
  }
  return pool
}

async function query(sql, params = []) {
  // Só executar no servidor (Node.js), não no browser
  if (typeof window !== 'undefined') {
    throw new Error('Database queries are not allowed on the client side');
  }
  
  const connection = createPool()
  try {
    console.log('🔍 [DATABASE QUERY] SQL:', sql)
    console.log('🔍 [DATABASE QUERY] Parâmetros:', params)
    
    // Garantir que params seja um array
    const safeParams = Array.isArray(params) ? params : []
    
    // Usar query para todas as operações para evitar problemas com prepared statements
    let results
    if (safeParams.length === 0) {
      [results] = await connection.query(sql)
    } else {
      [results] = await connection.query(sql, safeParams)
    }
    
    console.log('✅ [DATABASE QUERY] Resultado:', results)
    return results
  } catch (error) {
    console.error("❌ [DATABASE QUERY] Erro:", error)
    console.error("❌ [DATABASE QUERY] SQL:", sql)
    console.error("❌ [DATABASE QUERY] Parâmetros:", params)
    throw error
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

export {
  query,
  queryDirect,
  getNextNumber,
  createPool,
  execute,
}
