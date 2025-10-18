import { query, execute } from '../lib/database.js'
import fs from 'fs'
import path from 'path'

async function createServiceOrdersTables() {
  try {
    console.log('🚀 Iniciando criação das tabelas do módulo de Ordem de Serviço...')

    // Ler o arquivo SQL
    const sqlFile = path.join(process.cwd(), 'create-service-orders-tables.sql')
    const sqlContent = fs.readFileSync(sqlFile, 'utf8')

    // Dividir o conteúdo em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

    console.log(`📝 Executando ${commands.length} comandos SQL...`)

    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      if (command.trim()) {
        try {
          console.log(`⚡ Executando comando ${i + 1}/${commands.length}...`)
          await query(command)
        } catch (error) {
          console.error(`❌ Erro no comando ${i + 1}:`, error.message)
          // Continuar com os próximos comandos mesmo se houver erro
        }
      }
    }

    // Verificar se as tabelas foram criadas
    console.log('🔍 Verificando tabelas criadas...')
    
    const tables = await query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'hospital_maintenance' 
      AND TABLE_NAME IN ('service_orders', 'service_templates', 'template_categories', 'maintenance_history', 'maintenance_schedule', 'scheduled_notifications')
    `)

    console.log('✅ Tabelas encontradas:', tables.map(t => t.TABLE_NAME))

    // Verificar dados iniciais
    const categoriesCount = await query('SELECT COUNT(*) as count FROM template_categories')
    const templatesCount = await query('SELECT COUNT(*) as count FROM service_templates')

    console.log(`📊 Categorias de templates: ${categoriesCount[0].count}`)
    console.log(`📊 Templates de serviço: ${templatesCount[0].count}`)

    console.log('🎉 Módulo de Ordem de Serviço criado com sucesso!')

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error)
    throw error
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createServiceOrdersTables()
    .then(() => {
      console.log('✅ Script executado com sucesso!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erro na execução:', error)
      process.exit(1)
    })
}

export { createServiceOrdersTables }