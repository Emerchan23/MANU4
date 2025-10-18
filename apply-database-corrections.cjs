require('dotenv').config()
const mysql = require('mysql2/promise')

async function applyDatabaseCorrections() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  })

  try {
    console.log('🔧 APLICANDO CORREÇÕES NO BANCO DE DADOS')
    console.log('=' .repeat(70))
    
    // 1. Criar tabela empresas se não existir (referenciada no script)
    console.log('\n1️⃣ Criando tabela empresas se não existir...')
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS empresas (
          id INT(11) NOT NULL AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          cnpj VARCHAR(18) NULL,
          email VARCHAR(255) NULL,
          phone VARCHAR(20) NULL,
          address TEXT NULL,
          city VARCHAR(100) NULL,
          state VARCHAR(2) NULL,
          zip_code VARCHAR(10) NULL,
          contact_person VARCHAR(255) NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uk_empresas_cnpj (cnpj)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      console.log('  ✅ Tabela empresas criada/verificada')
    } catch (error) {
      console.log('  ⚠️ Erro ao criar tabela empresas:', error.message)
    }

    // 2. Inserir dados básicos na tabela empresas se estiver vazia
    console.log('\n2️⃣ Verificando dados na tabela empresas...')
    try {
      const [empresasCount] = await connection.execute('SELECT COUNT(*) as total FROM empresas')
      if (empresasCount[0].total === 0) {
        await connection.execute(`
          INSERT INTO empresas (name, cnpj, email, phone, contact_person) VALUES 
          ('TechMed Soluções', '12.345.678/0001-90', 'contato@techmed.com', '(11) 9999-8888', 'João Silva'),
          ('MedEquip Ltda', '98.765.432/0001-10', 'vendas@medequip.com', '(11) 8888-7777', 'Maria Santos'),
          ('Hospital Tech', '11.222.333/0001-44', 'suporte@hospitaltech.com', '(11) 7777-6666', 'Pedro Costa')
        `)
        console.log('  ✅ Dados básicos inseridos na tabela empresas')
      } else {
        console.log(`  ✅ Tabela empresas já possui ${empresasCount[0].total} registros`)
      }
    } catch (error) {
      console.log('  ⚠️ Erro ao inserir dados em empresas:', error.message)
    }

    // 3. Verificar se tabela service_orders existe antes de aplicar correções
    console.log('\n3️⃣ Verificando tabela service_orders...')
    const [tables] = await connection.execute("SHOW TABLES LIKE 'service_orders'")
    
    if (tables.length > 0) {
      console.log('  ✅ Tabela service_orders encontrada, aplicando correções...')
      
      // 3.1. Correção de ENUM de prioridades
      try {
        await connection.execute(`
          ALTER TABLE service_orders 
          MODIFY COLUMN priority ENUM('BAIXA','MEDIA','ALTA','CRITICA') NOT NULL DEFAULT 'MEDIA'
        `)
        console.log('  ✅ ENUM de prioridades corrigido')
      } catch (error) {
        console.log('  ⚠️ Erro ao corrigir prioridades:', error.message)
      }

      // 3.2. Correção de ENUM de status
      try {
        await connection.execute(`
          ALTER TABLE service_orders 
          MODIFY COLUMN status ENUM('ABERTA','EM_ANDAMENTO','AGUARDANDO_APROVACAO','APROVADA','REJEITADA','CONCLUIDA','CANCELADA') NOT NULL DEFAULT 'ABERTA'
        `)
        console.log('  ✅ ENUM de status corrigido')
      } catch (error) {
        console.log('  ⚠️ Erro ao corrigir status:', error.message)
      }

      // 3.3. Ajuste de tipo de dados para custo
      try {
        await connection.execute(`
          ALTER TABLE service_orders 
          MODIFY COLUMN cost DECIMAL(12,2) UNSIGNED NULL DEFAULT NULL
        `)
        console.log('  ✅ Tipo de dados para custo ajustado')
      } catch (error) {
        console.log('  ⚠️ Erro ao ajustar custo:', error.message)
      }

      // 3.4. Adicionar constraint para validação de custo
      try {
        await connection.execute(`
          ALTER TABLE service_orders 
          ADD CONSTRAINT chk_cost_positive CHECK (cost >= 0)
        `)
        console.log('  ✅ Constraint de custo positivo adicionada')
      } catch (error) {
        if (error.message.includes('Duplicate key name')) {
          console.log('  ✅ Constraint de custo já existe')
        } else {
          console.log('  ⚠️ Erro ao adicionar constraint de custo:', error.message)
        }
      }

      // 3.5. Adicionar índices de performance
      const indexes = [
        { name: 'idx_service_orders_priority', column: 'priority' },
        { name: 'idx_service_orders_requested_date', column: 'requested_date' },
        { name: 'idx_service_orders_status_priority', column: 'status, priority' },
        { name: 'idx_service_orders_equipment_status', column: 'equipment_id, status' }
      ]

      for (const index of indexes) {
        try {
          await connection.execute(`CREATE INDEX ${index.name} ON service_orders(${index.column})`)
          console.log(`  ✅ Índice ${index.name} criado`)
        } catch (error) {
          if (error.message.includes('Duplicate key name')) {
            console.log(`  ✅ Índice ${index.name} já existe`)
          } else {
            console.log(`  ⚠️ Erro ao criar índice ${index.name}:`, error.message)
          }
        }
      }

      // 3.6. Adicionar Foreign Keys
      try {
        await connection.execute(`
          ALTER TABLE service_orders 
          ADD CONSTRAINT fk_service_orders_equipment 
          FOREIGN KEY (equipment_id) REFERENCES equipment(id) 
          ON UPDATE CASCADE ON DELETE RESTRICT
        `)
        console.log('  ✅ FK para equipment adicionada')
      } catch (error) {
        if (error.message.includes('Duplicate foreign key constraint name')) {
          console.log('  ✅ FK para equipment já existe')
        } else {
          console.log('  ⚠️ Erro ao adicionar FK equipment:', error.message)
        }
      }

      try {
        await connection.execute(`
          ALTER TABLE service_orders 
          ADD CONSTRAINT fk_service_orders_company 
          FOREIGN KEY (company_id) REFERENCES empresas(id) 
          ON UPDATE CASCADE ON DELETE SET NULL
        `)
        console.log('  ✅ FK para empresas adicionada')
      } catch (error) {
        if (error.message.includes('Duplicate foreign key constraint name')) {
          console.log('  ✅ FK para empresas já existe')
        } else {
          console.log('  ⚠️ Erro ao adicionar FK empresas:', error.message)
        }
      }

    } else {
      console.log('  ⚠️ Tabela service_orders não encontrada, pulando correções')
    }

    // 4. Verificar e corrigir tabela maintenance_types
    console.log('\n4️⃣ Verificando tabela maintenance_types...')
    try {
      // Verificar se já tem os tipos básicos
      const [mtCount] = await connection.execute("SELECT COUNT(*) as total FROM maintenance_types WHERE name IN ('PREVENTIVA', 'CORRETIVA', 'PREDITIVA')")
      
      if (mtCount[0].total < 3) {
        await connection.execute(`
          INSERT IGNORE INTO maintenance_types (name, description, category) VALUES 
          ('PREVENTIVA', 'Manutenção preventiva programada', 'preventiva'),
          ('CORRETIVA', 'Manutenção corretiva para reparo', 'corretiva'),
          ('PREDITIVA', 'Manutenção baseada em condição', 'preventiva')
        `)
        console.log('  ✅ Tipos básicos de manutenção inseridos')
      } else {
        console.log('  ✅ Tipos básicos de manutenção já existem')
      }
    } catch (error) {
      console.log('  ⚠️ Erro ao verificar maintenance_types:', error.message)
    }

    // 5. Verificar estrutura da tabela maintenance_schedules
    console.log('\n5️⃣ Verificando tabela maintenance_schedules...')
    try {
      const [scheduleColumns] = await connection.execute('DESCRIBE maintenance_schedules')
      const columnNames = scheduleColumns.map(col => col.Field)
      
      console.log('  📋 Colunas existentes:')
      columnNames.forEach(col => console.log(`    - ${col}`))
      
      // Verificar se tem as colunas essenciais
      const essentialColumns = [
        'equipment_id', 'assigned_user_id', 'scheduled_date', 
        'priority', 'description', 'maintenance_type'
      ]
      
      const missingColumns = essentialColumns.filter(col => !columnNames.includes(col))
      if (missingColumns.length > 0) {
        console.log('  ⚠️ Colunas faltantes:', missingColumns.join(', '))
      } else {
        console.log('  ✅ Todas as colunas essenciais estão presentes')
      }
      
    } catch (error) {
      console.log('  ❌ Erro ao verificar maintenance_schedules:', error.message)
    }

    // 6. Verificação final
    console.log('\n6️⃣ Verificação final...')
    const [finalTables] = await connection.execute('SHOW TABLES')
    const finalTableNames = finalTables.map(row => Object.values(row)[0])
    
    const requiredTables = ['maintenance_schedules', 'equipment', 'companies', 'empresas', 'users', 'maintenance_types']
    const stillMissing = requiredTables.filter(table => !finalTableNames.includes(table))
    
    console.log('\n' + '=' .repeat(70))
    console.log('📋 RESULTADO FINAL:')
    console.log(`  ✅ Tabelas disponíveis: ${finalTableNames.length}`)
    
    if (stillMissing.length > 0) {
      console.log(`  ❌ Tabelas ainda faltantes: ${stillMissing.join(', ')}`)
    } else {
      console.log('  ✅ Todas as tabelas essenciais estão disponíveis')
    }

    console.log('\n🎯 PRÓXIMO PASSO: Testar criação de agendamento')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  } finally {
    await connection.end()
  }
}

applyDatabaseCorrections()