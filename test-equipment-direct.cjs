const { query } = require('./lib/database.js');

async function testEquipmentQuery() {
  console.log('🔍 Testando consulta direta ao banco de dados...');
  
  try {
    // Primeiro, vamos verificar se a tabela equipment existe
    console.log('📋 Verificando estrutura da tabela equipment...');
    const tableInfo = await query("DESCRIBE equipment", []);
    console.log('✅ Estrutura da tabela:', tableInfo);
    
    // Agora vamos buscar o equipamento com ID 1
    console.log('🔍 Buscando equipamento com ID 1...');
    const queryStr = `
      SELECT 
        e.*,
        s.nome as sector_name,
        c.name as category_name,
        sub.name as subsector_name
      FROM equipment e
      LEFT JOIN setores s ON e.sector_id = s.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN subsectors sub ON e.subsector_id = sub.id
      WHERE e.id = ?
    `;
    
    const rows = await query(queryStr, [1]);
    console.log('📊 Resultado da consulta:', rows);
    
    if (rows.length === 0) {
      console.log('❌ Nenhum equipamento encontrado com ID 1');
      
      // Vamos verificar se existem equipamentos na tabela
      console.log('🔍 Verificando todos os equipamentos...');
      const allEquipments = await query("SELECT id, name FROM equipment LIMIT 5", []);
      console.log('📊 Equipamentos existentes:', allEquipments);
    } else {
      console.log('✅ Equipamento encontrado:', rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Erro na consulta:', error);
  }
  
  process.exit(0);
}

testEquipmentQuery();