require('dotenv').config()
const mysql = require('mysql2/promise')

async function checkFullDatabaseStructure() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  })

  try {
    console.log('🔍 VERIFICAÇÃO COMPLETA DA ESTRUTURA DO BANCO DE DADOS')
    console.log('=' .repeat(70))
    
    // 1. Listar todas as tabelas existentes
    console.log('\n📋 TABELAS EXISTENTES:')
    const [tables] = await connection.execute('SHOW TABLES')
    const tableNames = tables.map(row => Object.values(row)[0])
    tableNames.forEach(table => console.log(`  ✅ ${table}`))
    
    // 2. Verificar tabelas essenciais para agendamentos
    console.log('\n🔍 VERIFICAÇÃO DE TABELAS ESSENCIAIS:')
    const essentialTables = [
      'maintenance_schedules',
      'service_orders', 
      'equipment',
      'companies',
      'empresas',
      'users',
      'maintenance_types'
    ]
    
    const missingTables = []
    for (const table of essentialTables) {
      if (tableNames.includes(table)) {
        console.log(`  ✅ ${table} - EXISTE`)
      } else {
        console.log(`  ❌ ${table} - NÃO EXISTE`)
        missingTables.push(table)
      }
    }

    // 3. Verificar estrutura da tabela maintenance_schedules (principal)
    if (tableNames.includes('maintenance_schedules')) {
      console.log('\n📋 ESTRUTURA DA TABELA maintenance_schedules:')
      console.log('-' .repeat(60))
      const [scheduleColumns] = await connection.execute('DESCRIBE maintenance_schedules')
      scheduleColumns.forEach(col => {
        console.log(`  ${col.Field.padEnd(25)} | ${col.Type.padEnd(20)} | ${col.Null} | ${col.Key} | ${col.Default}`)
      })
      
      // Verificar dados existentes
      const [scheduleCount] = await connection.execute('SELECT COUNT(*) as total FROM maintenance_schedules')
      console.log(`\n📊 Registros existentes: ${scheduleCount[0].total}`)
    }

    // 4. Verificar estrutura da tabela service_orders (se existir)
    if (tableNames.includes('service_orders')) {
      console.log('\n📋 ESTRUTURA DA TABELA service_orders:')
      console.log('-' .repeat(60))
      const [serviceColumns] = await connection.execute('DESCRIBE service_orders')
      serviceColumns.forEach(col => {
        console.log(`  ${col.Field.padEnd(25)} | ${col.Type.padEnd(20)} | ${col.Null} | ${col.Key} | ${col.Default}`)
      })
      
      // Verificar dados existentes
      const [serviceCount] = await connection.execute('SELECT COUNT(*) as total FROM service_orders')
      console.log(`\n📊 Registros existentes: ${serviceCount[0].total}`)
    }

    // 5. Verificar tabela maintenance_types
    if (tableNames.includes('maintenance_types')) {
      console.log('\n📋 ESTRUTURA DA TABELA maintenance_types:')
      console.log('-' .repeat(60))
      const [mtColumns] = await connection.execute('DESCRIBE maintenance_types')
      mtColumns.forEach(col => {
        console.log(`  ${col.Field.padEnd(25)} | ${col.Type.padEnd(20)} | ${col.Null} | ${col.Key} | ${col.Default}`)
      })
      
      // Verificar dados existentes
      const [mtData] = await connection.execute('SELECT * FROM maintenance_types')
      console.log(`\n📊 Tipos de manutenção disponíveis: ${mtData.length}`)
      mtData.forEach(mt => {
        console.log(`  - ID: ${mt.id} | Nome: ${mt.name} | Ativo: ${mt.isActive || mt.is_active}`)
      })
    }

    // 6. Verificar dados de referência (empresas, equipamentos, usuários)
    console.log('\n📊 DADOS DE REFERÊNCIA:')
    
    // Empresas
    if (tableNames.includes('companies')) {
      const [companies] = await connection.execute('SELECT COUNT(*) as total FROM companies')
      console.log(`  🏢 Empresas (companies): ${companies[0].total}`)
    }
    if (tableNames.includes('empresas')) {
      const [empresas] = await connection.execute('SELECT COUNT(*) as total FROM empresas')
      console.log(`  🏢 Empresas (empresas): ${empresas[0].total}`)
    }
    
    // Equipamentos
    if (tableNames.includes('equipment')) {
      const [equipment] = await connection.execute('SELECT COUNT(*) as total FROM equipment')
      console.log(`  🔧 Equipamentos: ${equipment[0].total}`)
    }
    
    // Usuários
    if (tableNames.includes('users')) {
      const [users] = await connection.execute('SELECT COUNT(*) as total FROM users')
      console.log(`  👤 Usuários: ${users[0].total}`)
    }

    // 7. Verificar foreign keys e constraints
    console.log('\n🔗 FOREIGN KEYS E CONSTRAINTS:')
    try {
      const [constraints] = await connection.execute(`
        SELECT 
          TABLE_NAME,
          CONSTRAINT_NAME,
          CONSTRAINT_TYPE,
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
        JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc 
          ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
        WHERE kcu.TABLE_SCHEMA = '${process.env.DB_NAME}'
        AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
        ORDER BY TABLE_NAME, CONSTRAINT_NAME
      `)
      
      if (constraints.length > 0) {
        constraints.forEach(fk => {
          console.log(`  🔗 ${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`)
        })
      } else {
        console.log('  ⚠️ Nenhuma foreign key encontrada')
      }
    } catch (error) {
      console.log('  ❌ Erro ao verificar foreign keys:', error.message)
    }

    // 8. Resumo final
    console.log('\n' + '=' .repeat(70))
    console.log('📋 RESUMO DA ANÁLISE:')
    console.log(`  ✅ Tabelas encontradas: ${tableNames.length}`)
    console.log(`  ❌ Tabelas faltantes: ${missingTables.length}`)
    
    if (missingTables.length > 0) {
      console.log('\n⚠️ TABELAS QUE PRECISAM SER CRIADAS:')
      missingTables.forEach(table => console.log(`  - ${table}`))
    }

    console.log('\n🎯 PRÓXIMOS PASSOS:')
    if (missingTables.length > 0) {
      console.log('  1. Criar tabelas faltantes')
    }
    if (!tableNames.includes('maintenance_schedules')) {
      console.log('  2. Criar tabela maintenance_schedules (PRINCIPAL)')
    }
    if (tableNames.includes('service_orders')) {
      console.log('  3. Aplicar correções na tabela service_orders')
    }
    console.log('  4. Inserir dados de teste se necessário')
    console.log('  5. Testar criação de agendamento')

  } catch (error) {
    console.error('❌ Erro na verificação:', error.message)
  } finally {
    await connection.end()
  }
}

checkFullDatabaseStructure()