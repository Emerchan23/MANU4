import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
}

async function testServiceOrderCreation() {
  let connection
  
  try {
    console.log('🔍 Conectando ao banco de dados...')
    connection = await mysql.createConnection(dbConfig)
    console.log('✅ Conectado com sucesso!\n')
    
    // Verificar estrutura da tabela service_orders
    console.log('📋 Verificando estrutura da tabela service_orders...')
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'service_orders'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database])
    
    console.log('📊 Colunas da tabela service_orders:')
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''}`)
    })
    
    // Verificar se existem equipamentos
    console.log('\n🔧 Verificando equipamentos disponíveis...')
    const [equipment] = await connection.execute('SELECT id, name FROM equipment LIMIT 5')
    console.log('Equipamentos encontrados:', equipment.length)
    equipment.forEach(eq => {
      console.log(`  - ID: ${eq.id}, Nome: ${eq.name}`)
    })
    
    // Verificar se existem empresas
    console.log('\n🏢 Verificando empresas disponíveis...')
    const [companies] = await connection.execute('SELECT id, nome FROM empresas LIMIT 5')
    console.log('Empresas encontradas:', companies.length)
    companies.forEach(comp => {
      console.log(`  - ID: ${comp.id}, Nome: ${comp.nome}`)
    })
    
    // Testar inserção com dados válidos
    if (equipment.length > 0 && companies.length > 0) {
      console.log('\n🧪 Testando inserção de ordem de serviço...')
      
      const testData = {
        order_number: 'OS-TEST-001',
        equipment_id: equipment[0].id,
        company_id: companies[0].id,
        description: 'Teste de criação de ordem de serviço',
        priority: 'media',
        status: 'aberta',
        created_by: 1,
        requested_date: new Date().toISOString().split('T')[0]
      }
      
      console.log('Dados de teste:', testData)
      
      try {
        const [result] = await connection.execute(`
          INSERT INTO service_orders (
            order_number, equipment_id, company_id, description, 
            priority, status, created_by, requested_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          testData.order_number,
          testData.equipment_id,
          testData.company_id,
          testData.description,
          testData.priority,
          testData.status,
          testData.created_by,
          testData.requested_date
        ])
        
        console.log('✅ Inserção bem-sucedida! ID:', result.insertId)
        
        // Limpar teste
        await connection.execute('DELETE FROM service_orders WHERE id = ?', [result.insertId])
        console.log('🧹 Registro de teste removido')
        
      } catch (insertError) {
        console.error('❌ Erro na inserção:', insertError.message)
        console.error('Código do erro:', insertError.code)
        console.error('SQL State:', insertError.sqlState)
      }
    } else {
      console.log('⚠️  Não há equipamentos ou empresas suficientes para teste')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

testServiceOrderCreation()