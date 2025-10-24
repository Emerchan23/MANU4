import mysql from 'mysql2/promise';

// Configuração do banco de dados com timezone brasileiro
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '-03:00', // Timezone de Brasília (America/Sao_Paulo - UTC-3)
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Criar pool de conexões
const pool = mysql.createPool(dbConfig);

// Testar conexão
pool.getConnection()
  .then(connection => {
    console.log('✅ Pool de conexões MySQL criado com sucesso');
    console.log('📅 Timezone configurado: America/Sao_Paulo (UTC-3)');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Erro ao criar pool de conexões:', err.message);
  });

// Função para executar queries
export async function query(sql: string, params: any[] = []) {
  // Só executar no servidor (Node.js), não no browser
  if (typeof window !== 'undefined') {
    throw new Error('Database queries are not allowed on the client side');
  }
  
  try {
    console.log('🔍 [DB] SQL:', sql);
    console.log('🔍 [DB] Parâmetros:', params);
    
    const [results] = await pool.execute(sql, params);
    console.log('✅ [DB] Resultado:', results);
    return results;
  } catch (error) {
    console.error('❌ [DB] Erro:', error);
    console.error('❌ [DB] SQL:', sql);
    console.error('❌ [DB] Parâmetros:', params);
    throw error;
  }
}

// Função para criar conexão individual
export async function createConnection() {
  return await mysql.createConnection(dbConfig);
}

// Exportar pool como db para compatibilidade
export const db = pool;
export default pool;