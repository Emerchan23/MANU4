const mysql = require('mysql2/promise');

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function debugSpecificSectors() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');

    // 1. Buscar dados específicos dos setores Administração e Enfermagem
    console.log('\n📊 === DADOS DOS SETORES ESPECÍFICOS ===');
    const [sectors] = await connection.execute(`
      SELECT * FROM setores 
      WHERE nome IN ('Administração', 'Enfermagem')
      ORDER BY nome
    `);
    
    console.log('Setores encontrados:', sectors);
    
    if (sectors.length === 0) {
      console.log('❌ Nenhum setor encontrado com os nomes "Administração" ou "Enfermagem"');
      
      // Buscar setores similares
      const [similarSectors] = await connection.execute(`
        SELECT * FROM setores 
        WHERE nome LIKE '%admin%' OR nome LIKE '%enferm%'
        ORDER BY nome
      `);
      console.log('Setores similares encontrados:', similarSectors);
      
      // Mostrar todos os setores para identificar os nomes corretos
      const [allSectors] = await connection.execute(`
        SELECT * FROM setores ORDER BY nome
      `);
      console.log('Todos os setores disponíveis:', allSectors);
      return;
    }

    // 2. Para cada setor, verificar dependências
    for (const sector of sectors) {
      console.log(`\n🔍 === ANÁLISE DO SETOR: ${sector.nome} (ID: ${sector.id}) ===`);
      
      // Verificar equipamentos
      const [equipments] = await connection.execute(`
        SELECT COUNT(*) as count FROM equipment WHERE sector_id = ?
      `, [sector.id]);
      console.log(`📦 Equipamentos vinculados: ${equipments[0].count}`);
      
      if (equipments[0].count > 0) {
        const [equipmentList] = await connection.execute(`
          SELECT id, name, status FROM equipment WHERE sector_id = ? LIMIT 5
        `, [sector.id]);
        console.log('Primeiros 5 equipamentos:', equipmentList);
      }
      
      // Verificar ordens de serviço
      const [serviceOrders] = await connection.execute(`
        SELECT COUNT(*) as count FROM service_orders 
        WHERE equipment_id IN (SELECT id FROM equipment WHERE sector_id = ?)
      `, [sector.id]);
      console.log(`🔧 Ordens de serviço relacionadas: ${serviceOrders[0].count}`);
      
      if (serviceOrders[0].count > 0) {
        const [serviceOrderList] = await connection.execute(`
          SELECT so.id, so.status, so.created_at, e.name as equipment_name
          FROM service_orders so
          JOIN equipment e ON so.equipment_id = e.id
          WHERE e.sector_id = ?
          ORDER BY so.created_at DESC
          LIMIT 5
        `, [sector.id]);
        console.log('Últimas 5 ordens de serviço:', serviceOrderList);
      }
      
      // Verificar usuários
      const [users] = await connection.execute(`
        SELECT COUNT(*) as count FROM users WHERE sector_id = ?
      `, [sector.id]);
      console.log(`👥 Usuários vinculados: ${users[0].count}`);
      
      if (users[0].count > 0) {
        const [userList] = await connection.execute(`
          SELECT id, name, email FROM users WHERE sector_id = ? LIMIT 5
        `, [sector.id]);
        console.log('Primeiros 5 usuários:', userList);
      }
    }

    // 3. Comparar com setores que funcionam
    console.log('\n📊 === COMPARAÇÃO COM OUTROS SETORES ===');
    const [allSectors] = await connection.execute(`
      SELECT s.*, 
             (SELECT COUNT(*) FROM equipment WHERE sector_id = s.id) as equipment_count,
             (SELECT COUNT(*) FROM users WHERE sector_id = s.id) as user_count
      FROM setores s
      ORDER BY s.nome
    `);
    
    console.log('Todos os setores e suas dependências:');
    allSectors.forEach(sector => {
      const isProblematic = ['Administração', 'Enfermagem'].includes(sector.nome);
      console.log(`${isProblematic ? '❌' : '✅'} ${sector.nome} (ID: ${sector.id}) - Equipamentos: ${sector.equipment_count}, Usuários: ${sector.user_count}`);
    });

    // 4. Verificar integridade dos dados
    console.log('\n🔍 === VERIFICAÇÃO DE INTEGRIDADE ===');
    
    // Verificar se há referências órfãs
    const [orphanEquipments] = await connection.execute(`
      SELECT e.* FROM equipment e
      LEFT JOIN setores s ON e.sector_id = s.id
      WHERE s.id IS NULL
    `);
    
    if (orphanEquipments.length > 0) {
      console.log('❌ Equipamentos órfãos (sem setor válido):', orphanEquipments);
    } else {
      console.log('✅ Nenhum equipamento órfão encontrado');
    }

    // Verificar se há usuários órfãos
    const [orphanUsers] = await connection.execute(`
      SELECT u.* FROM users u
      LEFT JOIN setores s ON u.sector_id = s.id
      WHERE s.id IS NULL
    `);
    
    if (orphanUsers.length > 0) {
      console.log('❌ Usuários órfãos (sem setor válido):', orphanUsers);
    } else {
      console.log('✅ Nenhum usuário órfão encontrado');
    }

    // 5. Testar exclusão simulada
    console.log('\n🧪 === TESTE DE EXCLUSÃO SIMULADA ===');
    
    for (const sector of sectors) {
      console.log(`\nTestando exclusão do setor: ${sector.nome}`);
      
      try {
        // Simular a verificação que o sistema faz antes de excluir
        const [equipmentCheck] = await connection.execute(`
          SELECT COUNT(*) as count FROM equipment WHERE sector_id = ?
        `, [sector.id]);
        
        const [userCheck] = await connection.execute(`
          SELECT COUNT(*) as count FROM users WHERE sector_id = ?
        `, [sector.id]);
        
        console.log(`Equipamentos: ${equipmentCheck[0].count}, Usuários: ${userCheck[0].count}`);
        
        if (equipmentCheck[0].count > 0 || userCheck[0].count > 0) {
          console.log('❌ Setor não pode ser excluído - possui dependências');
        } else {
          console.log('✅ Setor pode ser excluído - sem dependências');
        }
        
      } catch (error) {
        console.error(`❌ Erro ao testar exclusão do setor ${sector.nome}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Erro durante a análise:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com o banco fechada');
    }
  }
}

// Executar a análise
debugSpecificSectors().catch(console.error);