import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import fs from 'fs'

// Carregar variáveis de ambiente
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' })
}
dotenv.config()

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00'
}

async function dropAlertsTables() {
  console.log('⚙️ Iniciando remoção segura das tabelas de Alertas (conexão direta)...')
  let connection
  try {
    connection = await mysql.createConnection(dbConfig)
    await connection.execute('SET FOREIGN_KEY_CHECKS=0')

    const tables = [
      'dashboard_alerts',
      'alerts',
      'alert_history',
      'alert_configurations'
    ]

    for (const table of tables) {
      try {
        console.log(`🔽 Drop table if exists: ${table}`)
        await connection.execute(`DROP TABLE IF EXISTS \`${table}\``)
      } catch (err) {
        console.warn(`⚠️ Falha ao dropar tabela ${table}:`, err?.message || err)
      }
    }

    await connection.execute('SET FOREIGN_KEY_CHECKS=1')
    await connection.end()
    console.log('✅ Remoção concluída. Todas as tabelas de Alertas foram dropadas (se existirem).')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao remover tabelas de Alertas:', error?.message || error)
    try { if (connection) await connection.end() } catch {}
    process.exit(1)
  }
}

dropAlertsTables()