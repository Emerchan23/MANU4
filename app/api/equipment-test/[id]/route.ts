import { NextResponse } from 'next/server'
import { query } from '../../../../lib/database'

// Endpoint temporário para testar sem o bug do NextRequest
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🧪 TEST ROUTE - Iniciando teste de atualização...');
    console.log('📊 ID do equipamento:', params.id);

    // Método 1: Tentar com .text() primeiro
    let bodyData = {};
    
    try {
      const bodyText = await request.text();
      console.log('📊 Raw body text:', bodyText);
      
      if (bodyText.trim()) {
        bodyData = JSON.parse(bodyText);
        console.log('✅ Body parseado com sucesso:', bodyData);
      } else {
        throw new Error('Body vazio');
      }
    } catch (parseError) {
      console.error('❌ Erro ao parsear body:', parseError);
      return NextResponse.json({
        success: false,
        message: 'Erro ao parsear dados da requisição',
        error: parseError.message
      }, { status: 400 });
    }

    const {
      name,
      model,
      serial_number,
      manufacturer,
      sector_id,
      category_id,
      subsector_id,
      installation_date,
      maintenance_frequency_days,
      observations,
      patrimonio_number,
      status
    } = bodyData;

    // Validações básicas
    if (!name || !sector_id) {
      console.log('❌ Validação falhou - nome ou setor ausente');
      return NextResponse.json({
        success: false,
        message: 'Nome e setor são obrigatórios'
      }, { status: 400 });
    }

    // Verificar se o equipamento existe
    console.log('🔍 Verificando se equipamento existe...');
    const existing = await query('SELECT id FROM equipment WHERE id = ?', [params.id]);
    if (existing.length === 0) {
      console.log('❌ Equipamento não encontrado');
      return NextResponse.json({
        success: false,
        message: 'Equipamento não encontrado'
      }, { status: 404 });
    }

    console.log('✅ Equipamento encontrado, executando update...');
    
    // Mapear installation_date para acquisition_date
    const acquisitionDate = installation_date || null;
    console.log('📊 Mapeamento de data: installation_date =', installation_date, '-> acquisition_date =', acquisitionDate);

    const queryStr = `
      UPDATE equipment SET
        name = ?, model = ?, serial_number = ?, manufacturer = ?,
        sector_id = ?, category_id = ?, subsector_id = ?,
        acquisition_date = ?, maintenance_frequency_days = ?, observations = ?, 
        patrimonio_number = ?, status = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const updateParams = [
      name,
      model || null,
      serial_number || null,
      manufacturer || null,
      sector_id,
      category_id || null,
      subsector_id || null,
      acquisitionDate,
      maintenance_frequency_days || null,
      observations || null,
      patrimonio_number || null,
      status || 'ativo',
      params.id
    ];
    
    console.log('📊 Parâmetros do update:', updateParams);

    await query(queryStr, updateParams);
    
    console.log('✅ Update executado com sucesso');

    // Buscar o equipamento atualizado
    const updatedEquipment = await query(
      'SELECT * FROM equipment WHERE id = ?',
      [params.id]
    );

    console.log('📊 Equipamento atualizado:', updatedEquipment[0]);

    return NextResponse.json({
      success: true,
      data: updatedEquipment[0],
      message: 'Equipamento atualizado com sucesso (TEST ROUTE)'
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar equipamento:', error);
    console.error('❌ Stack trace:', error.stack);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor', error: error.message },
      { status: 500 }
    );
  }
}