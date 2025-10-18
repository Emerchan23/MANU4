import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
}

async function fixForeignKeys() {
  let connection
  
  try {
    console.log('🔍 Conectando ao banco de dados...')
    connection = await mysql.createConnection(dbConfig)
    console.log('✅ Conectado com sucesso!\n')
    
    // Verificar constraints existentes
    console.log('📋 Verificando constraints da tabela service_orders...')
    const [constraints] = await connection.execute(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'service_orders'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [dbConfig.database])
    
    console.log('Constraints encontradas:')
    constraints.forEach(constraint => {
      console.log(`  - ${constraint.CONSTRAINT_NAME}: ${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`)
    })
    
    // Remover constraint problemática se existir
    const empresasConstraint = constraints.find(c => c.REFERENCED_TABLE_NAME === 'empresas')
    if (empresasConstraint) {
      console.log(`\n🔧 Removendo constraint problemática: ${empresasConstraint.CONSTRAINT_NAME}`)
      await connection.execute(`ALTER TABLE service_orders DROP FOREIGN KEY ${empresasConstraint.CONSTRAINT_NAME}`)
      console.log('✅ Constraint removida com sucesso!')
    }
    
    // Verificar se a tabela companies existe
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'companies'
    `, [dbConfig.database])
    
    if (tables.length > 0) {
      console.log('\n🔧 Adicionando nova constraint para tabela companies...')
      try {
        await connection.execute(`
          ALTER TABLE service_orders 
          ADD CONSTRAINT fk_service_orders_company 
          FOREIGN KEY (company_id) REFERENCES companies(id) 
          ON DELETE SET NULL ON UPDATE CASCADE
        `)
        console.log('✅ Nova constraint adicionada com sucesso!')
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log('⚠️  Constraint já existe')
        } else {
          console.error('❌ Erro ao adicionar constraint:', error.message)
        }
      }
    } else {
      console.log('❌ Tabela companies não encontrada!')
    }
    
    // Testar inserção novamente
    console.log('\n🧪 Testando inserção após correção...')
    
    const [equipment] = await connection.execute('SELECT id, name FROM equipment LIMIT 1')
    const [companies] = await connection.execute('SELECT id, name FROM companies LIMIT 1')
    
    if (equipment.length > 0 && companies.length > 0) {
      const testData = {
        order_number: 'OS-TEST-FIX-001',
        equipment_id: equipment[0].id,
        company_id: companies[0].id,
        description: 'Teste após correção de foreign key',
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
      }
    }
    
    console.log('\n✅ Correção de foreign keys concluída!')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

fixForeignKeys()