import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do banco de dados (mesma da API)
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function testEquipmentUpdate() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexão estabelecida');
    
    // 1. Primeiro, vamos listar alguns equipamentos existentes
    console.log('\n📋 Listando equipamentos existentes...');
    const [equipments] = await connection.execute('SELECT id, name, observations FROM equipment LIMIT 5');
    console.log('Equipamentos encontrados:', equipments);
    
    if (equipments.length === 0) {
      console.log('❌ Nenhum equipamento encontrado para testar');
      return;
    }
    
    // 2. Vamos testar a atualização do primeiro equipamento
    const testEquipment = equipments[0];
    console.log(`\n🔧 Testando atualização do equipamento ID: ${testEquipment.id}`);
    console.log('Dados atuais:', testEquipment);
    
    // 3. Preparar dados de teste para atualização
    const updateData = {
      name: testEquipment.name + ' (TESTE ATUALIZADO)',
      observations: 'Observação de teste atualizada em ' + new Date().toISOString()
    };
    
    console.log('\n📝 Dados para atualização:', updateData);
    
    // 4. Executar a atualização
    const updateQuery = 'UPDATE equipment SET name = ?, observations = ?, updated_at = NOW() WHERE id = ?';
    const [updateResult] = await connection.execute(updateQuery, [
      updateData.name,
      updateData.observations,
      testEquipment.id
    ]);
    
    console.log('\n✅ Resultado da atualização:', updateResult);
    
    // 5. Verificar se a atualização foi bem-sucedida
    const [updatedEquipment] = await connection.execute(
      'SELECT id, name, observations, updated_at FROM equipment WHERE id = ?',
      [testEquipment.id]
    );
    
    console.log('\n🔍 Equipamento após atualização:', updatedEquipment[0]);
    
    // 6. Testar a mesma query que a API usa
    console.log('\n🧪 Testando query similar à API...');
    const apiUpdateData = {
      name: 'Teste API Update',
      model: 'Modelo Teste',
      serial_number: 'SN123456',
      manufacturer: 'Fabricante Teste',
      observations: 'Observações da API teste'
    };
    
    // Construir query dinâmica como na API
    const fields = Object.keys(apiUpdateData).filter(key => apiUpdateData[key] !== undefined);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const apiQuery = `UPDATE equipment SET ${setClause}, updated_at = NOW() WHERE id = ?`;
    const values = fields.map(field => apiUpdateData[field]);
    values.push(testEquipment.id);
    
    console.log('Query da API:', apiQuery);
    console.log('Valores:', values);
    
    const [apiResult] = await connection.execute(apiQuery, values);
    console.log('\n✅ Resultado da query da API:', apiResult);
    
    // 7. Verificar resultado final
    const [finalEquipment] = await connection.execute(
      'SELECT * FROM equipment WHERE id = ?',
      [testEquipment.id]
    );
    
    console.log('\n🎯 Estado final do equipamento:', finalEquipment[0]);
    
    // 8. Restaurar dados originais
    console.log('\n🔄 Restaurando dados originais...');
    await connection.execute(
      'UPDATE equipment SET name = ?, observations = ? WHERE id = ?',
      [testEquipment.name, testEquipment.observations, testEquipment.id]
    );
    
    console.log('✅ Teste de atualização concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

// Executar o teste
testEquipmentUpdate();