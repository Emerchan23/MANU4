import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
}

async function verificarBanco() {
  let connection
  
  try {
    console.log('🔍 Conectando ao banco de dados...')
    connection = await mysql.createConnection(dbConfig)
    console.log('✅ Conectado com sucesso!\n')
    
    // Verificação de tabela service_orders (funcionalidade descontinuada)
    console.log('📋 Verificando situação da tabela service_orders (DESCONTINUADA)...')
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'service_orders'
      LIMIT 1
    `, [dbConfig.database])

    if (columns.length === 0) {
      console.log('✅ Tabela service_orders não existe (correto). Nenhuma ação será tomada.')
    } else {
      console.log('⚠️ A tabela service_orders EXISTE, mas a funcionalidade foi removida.')
      console.log('   → Remova a tabela executando migrations/migrations/remove-service-orders-tables.sql')
      console.log('   → Não serão feitas alterações ou criações nesta tabela por este script.')
    }
    
    // Verificar outras tabelas importantes
    console.log('\n📋 Verificando outras tabelas...')
    const tables = ['equipment', 'companies', 'users', 'sectors', 'categories']
    
    for (const table of tables) {
      const [rows] = await connection.execute(`
        SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      `, [dbConfig.database, table])
      
      if (rows[0].count > 0) {
        const [countResult] = await connection.execute(`SELECT COUNT(*) as total FROM ${table}`)
        console.log(`  ✅ Tabela ${table} existe (${countResult[0].total} registros)`)
      } else {
        console.log(`  ❌ Tabela ${table} não existe!`)
      }
    }
    
    console.log('\n✅ Verificação concluída!')
    
  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

verificarBanco()
