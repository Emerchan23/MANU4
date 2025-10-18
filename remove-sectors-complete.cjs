const mysql = require('mysql2/promise');

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function removeSectorsComplete() {
  let connection;
  
  try {
    console.log('🔧 Iniciando remoção completa dos setores Administração e Enfermagem...');
    
    // Conectar ao banco
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');

    // Começar transação para garantir integridade
    await connection.beginTransaction();
    console.log('🔄 Transação iniciada');

    // ETAPA 1: Identificar equipamentos dos setores
    console.log('\n📋 === ETAPA 1: IDENTIFICANDO EQUIPAMENTOS ===');
    
    const [equipments] = await connection.execute(`
      SELECT id, name, sector_id 
      FROM equipment 
      WHERE sector_id IN (3, 4)
    `);
    
    console.log(`Equipamentos encontrados: ${equipments.length}`);
    equipments.forEach(eq => {
      console.log(`- ID: ${eq.id}, Nome: ${eq.name}, Setor: ${eq.sector_id}`);
    });

    if (equipments.length === 0) {
      console.log('⚠️ Nenhum equipamento encontrado nos setores');
    }

    // ETAPA 2: Excluir ordens de serviço
    console.log('\n🗑️ === ETAPA 2: EXCLUINDO ORDENS DE SERVIÇO ===');
    
    if (equipments.length > 0) {
      const equipmentIds = equipments.map(eq => eq.id);
      
      // Primeiro, verificar quantas ordens existem
      const [serviceOrders] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM service_orders 
        WHERE equipment_id IN (${equipmentIds.map(() => '?').join(',')})
      `, equipmentIds);
      
      console.log(`Ordens de serviço a serem excluídas: ${serviceOrders[0].count}`);
      
      if (serviceOrders[0].count > 0) {
        // Excluir ordens de serviço
        const [deleteOrders] = await connection.execute(`
          DELETE FROM service_orders 
          WHERE equipment_id IN (${equipmentIds.map(() => '?').join(',')})
        `, equipmentIds);
        
        console.log(`✅ ${deleteOrders.affectedRows} ordens de serviço excluídas`);
      }
    }

    // ETAPA 3: Excluir equipamentos
    console.log('\n🔧 === ETAPA 3: EXCLUINDO EQUIPAMENTOS ===');
    
    if (equipments.length > 0) {
      const [deleteEquipments] = await connection.execute(`
        DELETE FROM equipment 
        WHERE sector_id IN (3, 4)
      `);
      
      console.log(`✅ ${deleteEquipments.affectedRows} equipamentos excluídos`);
    }

    // ETAPA 4: Excluir subsetores (se existirem)
    console.log('\n📂 === ETAPA 4: VERIFICANDO SUBSETORES ===');
    
    const [subsectors] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM subsetores 
      WHERE setor_id IN (3, 4)
    `);
    
    console.log(`Subsetores encontrados: ${subsectors[0].count}`);
    
    if (subsectors[0].count > 0) {
      const [deleteSubsectors] = await connection.execute(`
        DELETE FROM subsetores 
        WHERE setor_id IN (3, 4)
      `);
      
      console.log(`✅ ${deleteSubsectors.affectedRows} subsetores excluídos`);
    }

    // ETAPA 5: Excluir os setores
    console.log('\n🏢 === ETAPA 5: EXCLUINDO SETORES ===');
    
    // Setor Administração (ID: 3)
    const [deleteAdmin] = await connection.execute(`
      DELETE FROM setores WHERE id = 3
    `);
    console.log(`✅ Setor Administração: ${deleteAdmin.affectedRows} registro excluído`);
    
    // Setor Enfermagem (ID: 4)
    const [deleteNursing] = await connection.execute(`
      DELETE FROM setores WHERE id = 4
    `);
    console.log(`✅ Setor Enfermagem: ${deleteNursing.affectedRows} registro excluído`);

    // Confirmar transação
    await connection.commit();
    console.log('\n✅ === TRANSAÇÃO CONFIRMADA ===');

    // ETAPA 6: Verificação final
    console.log('\n🔍 === ETAPA 6: VERIFICAÇÃO FINAL ===');
    
    const [remainingSectors] = await connection.execute(`
      SELECT id, nome FROM setores WHERE id IN (3, 4)
    `);
    
    const [remainingEquipments] = await connection.execute(`
      SELECT COUNT(*) as count FROM equipment WHERE sector_id IN (3, 4)
    `);
    
    const [remainingOrders] = await connection.execute(`
      SELECT COUNT(*) as count FROM service_orders 
      WHERE equipment_id IN (
        SELECT id FROM equipment WHERE sector_id IN (3, 4)
      )
    `);

    console.log(`Setores restantes: ${remainingSectors.length}`);
    console.log(`Equipamentos restantes: ${remainingEquipments[0].count}`);
    console.log(`Ordens de serviço restantes: ${remainingOrders[0].count}`);

    if (remainingSectors.length === 0 && remainingEquipments[0].count === 0 && remainingOrders[0].count === 0) {
      console.log('\n🎉 === REMOÇÃO COMPLETA BEM-SUCEDIDA ===');
      console.log('✅ Todos os setores, equipamentos e ordens de serviço foram removidos com sucesso!');
    } else {
      console.log('\n⚠️ === ATENÇÃO ===');
      console.log('Alguns registros podem não ter sido removidos completamente');
    }

  } catch (error) {
    console.error('❌ Erro durante a remoção:', error.message);
    
    if (connection) {
      try {
        await connection.rollback();
        console.log('🔄 Transação revertida devido ao erro');
      } catch (rollbackError) {
        console.error('❌ Erro ao reverter transação:', rollbackError.message);
      }
    }
    
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão com o banco fechada');
    }
  }
}

// Executar o script
removeSectorsComplete().catch(console.error);