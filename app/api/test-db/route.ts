import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/database.js';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testando conexão com o banco de dados...');
    
    // Testar conexão básica
    const testQuery = 'SELECT 1 as test';
    const testResult = await query(testQuery, []);
    console.log('✅ Conexão com banco OK:', testResult);
    
    // Verificar se a tabela equipment existe
    const tableExistsQuery = `
      SELECT COUNT(*) as table_exists 
      FROM information_schema.tables 
      WHERE table_schema = 'hospital_maintenance' 
      AND table_name = 'equipment'
    `;
    const tableExists = await query(tableExistsQuery, []);
    console.log('📊 Tabela equipment existe:', tableExists);
    
    // Se a tabela existe, contar registros
    let equipmentCount = null;
    if (tableExists[0]?.table_exists > 0) {
      const countQuery = 'SELECT COUNT(*) as total FROM equipment';
      const countResult = await query(countQuery, []);
      equipmentCount = countResult[0]?.total;
      console.log('📊 Total de equipamentos:', equipmentCount);
    }
    
    // Verificar estrutura da tabela
    let tableStructure = null;
    if (tableExists[0]?.table_exists > 0) {
      const structureQuery = 'DESCRIBE equipment';
      tableStructure = await query(structureQuery, []);
      console.log('🏗️ Estrutura da tabela equipment:', tableStructure);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        connection: 'OK',
        tableExists: tableExists[0]?.table_exists > 0,
        equipmentCount,
        tableStructure
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Erro no teste do banco:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao testar banco de dados', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}