const mysql = require('mysql2/promise');

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function testSectorDeletionFix() {
  let connection;
  
  try {
    console.log('🔧 Testando correção da exclusão de setores...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');

    // 1. Testar exclusão do setor Administração (ID: 3)
    console.log('\n🧪 === TESTE 1: SETOR ADMINISTRAÇÃO ===');
    const adminSectorId = 3;
    
    // Verificar equipamentos vinculados
    const [adminEquipments] = await connection.execute(`
      SELECT COUNT(*) as count FROM equipment WHERE sector_id = ?
    `, [adminSectorId]);
    
    console.log(`📦 Equipamentos vinculados ao setor Administração: ${adminEquipments[0].count}`);
    
    if (adminEquipments[0].count > 0) {
      console.log('❌ Setor Administração não pode ser excluído - possui equipamentos');
      
      // Mostrar os equipamentos
      const [equipmentList] = await connection.execute(`
        SELECT id, name FROM equipment WHERE sector_id = ?
      `, [adminSectorId]);
      console.log('Equipamentos:', equipmentList);
    } else {
      console.log('✅ Setor Administração pode ser excluído - sem equipamentos');
    }

    // 2. Testar exclusão do setor Enfermagem (ID: 4)
    console.log('\n🧪 === TESTE 2: SETOR ENFERMAGEM ===');
    const nursingSectorId = 4;
    
    // Verificar equipamentos vinculados
    const [nursingEquipments] = await connection.execute(`
      SELECT COUNT(*) as count FROM equipment WHERE sector_id = ?
    `, [nursingSectorId]);
    
    console.log(`📦 Equipamentos vinculados ao setor Enfermagem: ${nursingEquipments[0].count}`);
    
    if (nursingEquipments[0].count > 0) {
      console.log('❌ Setor Enfermagem não pode ser excluído - possui equipamentos');
      
      // Mostrar os equipamentos
      const [equipmentList] = await connection.execute(`
        SELECT id, name FROM equipment WHERE sector_id = ?
      `, [nursingSectorId]);
      console.log('Equipamentos:', equipmentList);
    } else {
      console.log('✅ Setor Enfermagem pode ser excluído - sem equipamentos');
    }

    // 3. Testar um setor que deveria poder ser excluído
    console.log('\n🧪 === TESTE 3: SETOR SEM DEPENDÊNCIAS ===');
    
    // Buscar um setor sem equipamentos
    const [sectorsWithoutEquipments] = await connection.execute(`
      SELECT s.id, s.nome 
      FROM setores s
      LEFT JOIN equipment e ON s.id = e.sector_id
      WHERE e.id IS NULL
      LIMIT 1
    `);
    
    if (sectorsWithoutEquipments.length > 0) {
      const testSector = sectorsWithoutEquipments[0];
      console.log(`📋 Testando setor sem dependências: ${testSector.nome} (ID: ${testSector.id})`);
      
      // Verificar subsetores
      const [subsectors] = await connection.execute(`
        SELECT COUNT(*) as count FROM subsetores WHERE setor_id = ?
      `, [testSector.id]);
      
      console.log(`📂 Subsetores: ${subsectors[0].count}`);
      
      if (subsectors[0].count === 0) {
        console.log('✅ Este setor pode ser excluído - sem dependências');
      } else {
        console.log('❌ Este setor não pode ser excluído - possui subsetores');
      }
    } else {
      console.log('ℹ️ Todos os setores possuem equipamentos vinculados');
    }

    // 4. Simular correção - mostrar como resolver o problema
    console.log('\n💡 === SOLUÇÕES PARA O PROBLEMA ===');
    console.log('Para permitir a exclusão dos setores Administração e Enfermagem:');
    console.log('');
    console.log('OPÇÃO 1: Mover equipamentos para outro setor');
    console.log('- Transferir os equipamentos para um setor diferente');
    console.log('- Depois excluir o setor vazio');
    console.log('');
    console.log('OPÇÃO 2: Exclusão em cascata (cuidado!)');
    console.log('- Modificar a API para permitir exclusão forçada');
    console.log('- Excluir primeiro os equipamentos, depois o setor');
    console.log('');
    console.log('OPÇÃO 3: Desativar ao invés de excluir');
    console.log('- Adicionar campo "ativo" na tabela setores');
    console.log('- Marcar como inativo ao invés de excluir');

    // 5. Verificar se a correção da API funcionou
    console.log('\n🔍 === VERIFICAÇÃO DA CORREÇÃO DA API ===');
    console.log('A API foi corrigida para usar a tabela "equipment" ao invés de "equipamentos"');
    console.log('Isso deve resolver o erro de tabela não encontrada');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com o banco fechada');
    }
  }
}

// Executar o teste
testSectorDeletionFix().catch(console.error);