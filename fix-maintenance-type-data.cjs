const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function fixMaintenanceTypeData() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados MariaDB');
    
    console.log('\n🔧 Corrigindo dados de maintenance_type...');
    
    // Verificar dados atuais
    console.log('📋 Verificando dados atuais...');
    const [currentData] = await connection.execute(`
      SELECT id, name, maintenance_type 
      FROM maintenance_plans 
      WHERE maintenance_type IS NULL OR maintenance_type = ''
    `);
    
    console.log(`Encontrados ${currentData.length} registros com maintenance_type vazio`);
    
    // Atualizar registros baseado no nome
    console.log('📋 Atualizando maintenance_type baseado no nome...');
    
    await connection.execute(`
      UPDATE maintenance_plans 
      SET maintenance_type = 'PREVENTIVE'
      WHERE (maintenance_type IS NULL OR maintenance_type = '') 
      AND (name LIKE '%Preventiva%' OR name LIKE '%Preventive%')
    `);
    
    await connection.execute(`
      UPDATE maintenance_plans 
      SET maintenance_type = 'CORRECTIVE'
      WHERE (maintenance_type IS NULL OR maintenance_type = '') 
      AND (name LIKE '%Corretiva%' OR name LIKE '%Corrective%')
    `);
    
    await connection.execute(`
      UPDATE maintenance_plans 
      SET maintenance_type = 'PREDICTIVE'
      WHERE (maintenance_type IS NULL OR maintenance_type = '') 
      AND (name LIKE '%Preditiva%' OR name LIKE '%Predictive%')
    `);
    
    // Definir PREVENTIVE como padrão para os restantes
    await connection.execute(`
      UPDATE maintenance_plans 
      SET maintenance_type = 'PREVENTIVE'
      WHERE maintenance_type IS NULL OR maintenance_type = ''
    `);
    
    console.log('✅ Dados de maintenance_type atualizados!');
    
    // Verificar resultado final
    console.log('\n📊 Verificando resultado final...');
    const [finalData] = await connection.execute(`
      SELECT id, name, maintenance_type, frequency, estimated_duration, is_active 
      FROM maintenance_plans 
      ORDER BY id
    `);
    
    console.log('\nDados finais:');
    finalData.forEach(plan => {
      console.log(`  - ID: ${plan.id}, Nome: ${plan.name}, Tipo: ${plan.maintenance_type}, Frequência: ${plan.frequency}, Duração: ${plan.estimated_duration}min, Ativo: ${plan.is_active}`);
    });
    
    console.log('\n🎉 Correção de dados concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixMaintenanceTypeData();