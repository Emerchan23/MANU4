require('dotenv').config()
const mysql = require('mysql2/promise')

async function checkAvailableData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  })

  try {
    console.log('🔍 Verificando dados disponíveis no banco...\n')

    // Verificar empresas
    console.log('📋 EMPRESAS DISPONÍVEIS:')
    try {
      const [companies] = await connection.execute('SELECT id, name FROM companies LIMIT 5')
      companies.forEach(company => {
        console.log(`  - ID: ${company.id}, Nome: ${company.name}`)
      })
    } catch (error) {
      console.log('  ⚠️ Tabela companies não encontrada, tentando empresas...')
      try {
        const [companies] = await connection.execute('SELECT id, name FROM empresas LIMIT 5')
        companies.forEach(company => {
          console.log(`  - ID: ${company.id}, Nome: ${company.name}`)
        })
      } catch (error2) {
        console.log('  ❌ Nenhuma tabela de empresas encontrada')
      }
    }

    // Verificar equipamentos
    console.log('\n🔧 EQUIPAMENTOS DISPONÍVEIS:')
    try {
      const [equipment] = await connection.execute(`
        SELECT e.id, e.name, e.model, e.setor_id, e.subsetor_id
        FROM equipment e 
        LIMIT 5
      `)
      equipment.forEach(eq => {
        console.log(`  - ID: ${eq.id}, Nome: ${eq.name}, Modelo: ${eq.model}, Setor ID: ${eq.setor_id}, Subsetor ID: ${eq.subsetor_id}`)
      })
    } catch (error) {
      console.log('  ❌ Tabela equipment não encontrada:', error.message)
    }

    // Verificar usuários
    console.log('\n👥 USUÁRIOS DISPONÍVEIS:')
    try {
      const [users] = await connection.execute('SELECT id, name, email FROM users LIMIT 5')
      users.forEach(user => {
        console.log(`  - ID: ${user.id}, Nome: ${user.name}, Email: ${user.email}`)
      })
    } catch (error) {
      console.log('  ❌ Tabela users não encontrada')
    }

    // Verificar tipos de manutenção
    console.log('\n🔨 TIPOS DE MANUTENÇÃO:')
    try {
      const [maintenanceTypes] = await connection.execute('SELECT id, name, description FROM maintenance_types')
      maintenanceTypes.forEach(type => {
        console.log(`  - ID: ${type.id}, Nome: ${type.name}, Descrição: ${type.description}`)
      })
    } catch (error) {
      console.log('  ❌ Tabela maintenance_types não encontrada')
    }

    // Verificar templates de serviço
    console.log('\n📄 TEMPLATES DE SERVIÇO:')
    try {
      const [templates] = await connection.execute('SELECT id, name, description FROM service_templates WHERE active = 1 LIMIT 5')
      templates.forEach(template => {
        console.log(`  - ID: ${template.id}, Nome: ${template.name}`)
      })
    } catch (error) {
      console.log('  ❌ Tabela service_templates não encontrada')
    }

    console.log('\n✅ Verificação concluída!')

  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error.message)
  } finally {
    await connection.end()
  }
}

checkAvailableData()