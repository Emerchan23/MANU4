require('dotenv').config()
const mysql = require('mysql2/promise')

async function checkTablesStructure() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  })

  try {
    console.log('🔍 Verificando estrutura das tabelas...\n')
    
    // Verificar estrutura da tabela maintenance_schedules
    console.log('📋 ESTRUTURA DA TABELA maintenance_schedules:')
    console.log('=' .repeat(60))
    const [scheduleColumns] = await connection.execute('DESCRIBE maintenance_schedules')
    scheduleColumns.forEach(col => {
      console.log(`  ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`)
    })

    // Verificar se há dados na tabela
    const [scheduleCount] = await connection.execute('SELECT COUNT(*) as total FROM maintenance_schedules')
    console.log(`\n📊 Total de registros: ${scheduleCount[0].total}`)

    // Se há registros, mostrar os últimos 3
    if (scheduleCount[0].total > 0) {
      console.log('\n📋 ÚLTIMOS 3 AGENDAMENTOS:')
      console.log('=' .repeat(60))
      const [schedules] = await connection.execute(`
        SELECT * FROM maintenance_schedules 
        ORDER BY created_at DESC 
        LIMIT 3
      `)
      
      schedules.forEach((schedule, index) => {
        console.log(`\n${index + 1}. ID: ${schedule.id}`)
        Object.keys(schedule).forEach(key => {
          if (schedule[key] !== null) {
            console.log(`   ${key}: ${schedule[key]}`)
          }
        })
      })
    }

    // Verificar outras tabelas relacionadas
    console.log('\n\n🏢 ESTRUTURA DA TABELA companies:')
    console.log('=' .repeat(60))
    const [companyColumns] = await connection.execute('DESCRIBE companies')
    companyColumns.forEach(col => {
      console.log(`  ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`)
    })

    console.log('\n\n🔧 ESTRUTURA DA TABELA equipment:')
    console.log('=' .repeat(60))
    const [equipmentColumns] = await connection.execute('DESCRIBE equipment')
    equipmentColumns.forEach(col => {
      console.log(`  ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`)
    })

    console.log('\n\n👤 ESTRUTURA DA TABELA users:')
    console.log('=' .repeat(60))
    const [userColumns] = await connection.execute('DESCRIBE users')
    userColumns.forEach(col => {
      console.log(`  ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`)
    })

    console.log('\n\n🔨 ESTRUTURA DA TABELA maintenance_types:')
    console.log('=' .repeat(60))
    const [mtColumns] = await connection.execute('DESCRIBE maintenance_types')
    mtColumns.forEach(col => {
      console.log(`  ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`)
    })

  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error.message)
  } finally {
    await connection.end()
  }
}

checkTablesStructure()