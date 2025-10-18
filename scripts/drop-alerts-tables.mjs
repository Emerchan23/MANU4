import { execute } from '../lib/database.js'

async function dropAlertsTables() {
  console.log('⚙️ Iniciando remoção segura das tabelas de Alertas...')
  try {
    await execute('SET FOREIGN_KEY_CHECKS=0')

    const tables = [
      'dashboard_alerts',
      'alerts',
      'alert_history',
      'alert_configurations'
    ]

    for (const table of tables) {
      try {
        console.log(`🔽 Drop table if exists: ${table}`)
        await execute(`DROP TABLE IF EXISTS \`${table}\``)
      } catch (err) {
        console.warn(`⚠️ Falha ao dropar tabela ${table}:`, err?.message || err)
      }
    }

    await execute('SET FOREIGN_KEY_CHECKS=1')
    console.log('✅ Remoção concluída. Todas as tabelas de Alertas foram dropadas (se existirem).')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao remover tabelas de Alertas:', error?.message || error)
    process.exit(1)
  }
}

dropAlertsTables()