const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function fixMaintenancePlansStructure() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados MariaDB');
    
    console.log('\n🔧 Corrigindo estrutura da tabela maintenance_plans...');
    
    // 1. Adicionar coluna frequency se não existir
    console.log('📋 Adicionando coluna frequency...');
    try {
      await connection.execute(`
        ALTER TABLE maintenance_plans 
        ADD COLUMN frequency ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL') DEFAULT 'MONTHLY' AFTER description
      `);
      console.log('✅ Coluna frequency adicionada!');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Coluna frequency já existe');
      } else {
        throw error;
      }
    }
    
    // 2. Modificar coluna maintenance_type para usar valores em inglês
    console.log('📋 Modificando coluna maintenance_type...');
    await connection.execute(`
      ALTER TABLE maintenance_plans 
      MODIFY COLUMN maintenance_type ENUM('PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE') DEFAULT 'PREVENTIVE'
    `);
    console.log('✅ Coluna maintenance_type modificada!');
    
    // 3. Renomear coluna active para is_active
    console.log('📋 Renomeando coluna active para is_active...');
    try {
      await connection.execute(`
        ALTER TABLE maintenance_plans 
        CHANGE COLUMN active is_active BOOLEAN DEFAULT TRUE
      `);
      console.log('✅ Coluna active renomeada para is_active!');
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('ℹ️ Coluna active não existe ou já foi renomeada');
      } else {
        throw error;
      }
    }
    
    // 4. Renomear estimated_duration_hours para estimated_duration (em minutos)
    console.log('📋 Modificando coluna estimated_duration...');
    try {
      await connection.execute(`
        ALTER TABLE maintenance_plans 
        CHANGE COLUMN estimated_duration_hours estimated_duration INT DEFAULT 60
      `);
      console.log('✅ Coluna estimated_duration_hours renomeada e convertida para minutos!');
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('ℹ️ Coluna estimated_duration_hours não existe ou já foi renomeada');
      } else {
        throw error;
      }
    }
    
    // 5. Adicionar coluna equipment_ids como JSON
    console.log('📋 Adicionando coluna equipment_ids...');
    try {
      await connection.execute(`
        ALTER TABLE maintenance_plans 
        ADD COLUMN equipment_ids JSON AFTER estimated_cost
      `);
      console.log('✅ Coluna equipment_ids adicionada!');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Coluna equipment_ids já existe');
      } else {
        throw error;
      }
    }
    
    // 6. Atualizar dados existentes
    console.log('📋 Atualizando dados existentes...');
    
    // Converter maintenance_type de português para inglês
    await connection.execute(`
      UPDATE maintenance_plans 
      SET maintenance_type = CASE 
        WHEN maintenance_type = 'preventiva' THEN 'PREVENTIVE'
        WHEN maintenance_type = 'corretiva' THEN 'CORRECTIVE'
        WHEN maintenance_type = 'preditiva' THEN 'PREDICTIVE'
        ELSE maintenance_type
      END
    `);
    
    // Definir frequency padrão baseado no frequency_days
    await connection.execute(`
      UPDATE maintenance_plans 
      SET frequency = CASE 
        WHEN frequency_days <= 7 THEN 'WEEKLY'
        WHEN frequency_days <= 31 THEN 'MONTHLY'
        WHEN frequency_days <= 93 THEN 'QUARTERLY'
        WHEN frequency_days <= 186 THEN 'SEMIANNUAL'
        ELSE 'ANNUAL'
      END
      WHERE frequency IS NULL
    `);
    
    // Inicializar equipment_ids como array vazio
    await connection.execute(`
      UPDATE maintenance_plans 
      SET equipment_ids = '[]'
      WHERE equipment_ids IS NULL
    `);
    
    // Converter estimated_duration de horas para minutos (se ainda estiver em horas)
    await connection.execute(`
      UPDATE maintenance_plans 
      SET estimated_duration = estimated_duration * 60
      WHERE estimated_duration < 10
    `);
    
    console.log('✅ Dados atualizados!');
    
    // 7. Verificar estrutura final
    console.log('\n📋 Verificando estrutura final...');
    const [columns] = await connection.execute(`DESCRIBE maintenance_plans`);
    
    console.log('\nEstrutura final da tabela maintenance_plans:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Key ? `[${col.Key}]` : ''} ${col.Default ? `DEFAULT: ${col.Default}` : ''}`);
    });
    
    // 8. Mostrar dados de exemplo
    console.log('\n📊 Dados de exemplo após correção:');
    const [samplePlans] = await connection.execute(`
      SELECT id, name, frequency, maintenance_type, estimated_duration, is_active 
      FROM maintenance_plans 
      LIMIT 5
    `);
    
    samplePlans.forEach(plan => {
      console.log(`  - ID: ${plan.id}, Nome: ${plan.name}, Frequência: ${plan.frequency}, Tipo: ${plan.maintenance_type}, Duração: ${plan.estimated_duration}min, Ativo: ${plan.is_active}`);
    });
    
    console.log('\n🎉 Estrutura da tabela maintenance_plans corrigida com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixMaintenancePlansStructure();