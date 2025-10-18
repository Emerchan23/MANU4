import mysql from 'mysql2/promise';

// Configuração do banco de dados (mesma da API)
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function simulateApiUpdate() {
  let connection;
  
  try {
    console.log('🔍 Simulando exatamente o que a API faz...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexão estabelecida');
    
    // 1. Listar equipamentos disponíveis
    console.log('\n📋 Listando equipamentos disponíveis...');
    const [equipments] = await connection.execute('SELECT id, name FROM equipment LIMIT 3');
    console.log('Equipamentos:', equipments);
    
    if (equipments.length === 0) {
      console.log('❌ Nenhum equipamento encontrado');
      return;
    }
    
    const testId = equipments[0].id;
    console.log(`\n🎯 Testando com equipamento ID: ${testId}`);
    
    // 2. Simular exatamente o que a API faz - verificar se existe
    console.log('\n🔍 Verificando se equipamento existe (como na API)...');
    const [existingEquipment] = await connection.execute(
      'SELECT * FROM equipment WHERE id = ?',
      [testId]
    );
    
    console.log('Equipamento encontrado:', existingEquipment.length > 0 ? 'SIM' : 'NÃO');
    
    if (existingEquipment.length === 0) {
      console.log('❌ Equipamento não encontrado - retornaria 404');
      return;
    }
    
    console.log('✅ Equipamento existe, dados atuais:', existingEquipment[0]);
    
    // 3. Simular dados de atualização como enviados pelo frontend
    const updateData = {
      name: 'Equipamento Atualizado via API Simulation',
      model: 'Modelo Atualizado',
      serial_number: 'SN999999',
      manufacturer: 'Fabricante Atualizado',
      observations: 'Observações atualizadas via simulação da API',
      sector_id: 1,
      category_id: 1,
      subsector_id: null,
      specifications: JSON.stringify({
        patrimonio: 'PAT999',
        categoria: 'Categoria Teste',
        voltagem: '220V',
        subsetor: null
      })
    };
    
    console.log('\n📝 Dados para atualização:', updateData);
    
    // 4. Construir query dinâmica exatamente como na API
    const fields = Object.keys(updateData).filter(key => updateData[key] !== undefined);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE equipment SET ${setClause}, updated_at = NOW() WHERE id = ?`;
    const values = fields.map(field => updateData[field]);
    values.push(testId);
    
    console.log('\n🔧 Query construída:', query);
    console.log('🔧 Valores:', values);
    
    // 5. Executar a atualização
    const [result] = await connection.execute(query, values);
    console.log('\n✅ Resultado da atualização:', result);
    
    if (result.affectedRows === 0) {
      console.log('❌ Nenhuma linha foi afetada - equipamento não encontrado');
      return;
    }
    
    // 6. Buscar equipamento atualizado
    console.log('\n🔍 Buscando equipamento atualizado...');
    const [updatedEquipment] = await connection.execute(
      'SELECT * FROM equipment WHERE id = ?',
      [testId]
    );
    
    console.log('✅ Equipamento após atualização:', updatedEquipment[0]);
    
    // 7. Testar diferentes tipos de ID (string vs number)
    console.log('\n🧪 Testando com ID como string...');
    const stringId = testId.toString();
    const [testWithString] = await connection.execute(
      'SELECT id, name FROM equipment WHERE id = ?',
      [stringId]
    );
    
    console.log(`ID como string '${stringId}' encontrou:`, testWithString.length > 0 ? 'SIM' : 'NÃO');
    
    // 8. Testar com ID inválido
    console.log('\n🧪 Testando com ID inválido...');
    const [testInvalid] = await connection.execute(
      'SELECT id, name FROM equipment WHERE id = ?',
      [99999]
    );
    
    console.log('ID inválido (99999) encontrou:', testInvalid.length > 0 ? 'SIM' : 'NÃO');
    
    console.log('\n✅ Simulação da API concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a simulação:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

// Executar a simulação
simulateApiUpdate();