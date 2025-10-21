import { NextResponse } from 'next/server'
import { query } from '../../../../lib/database'

// GET - Buscar equipamento por ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 GET /api/equipment/[id] - Buscando equipamento...');
    console.log('📊 ID do equipamento:', params.id);

    const equipment = await query(
      `SELECT e.*, 
              s.name as sector_name, 
              c.name as category_name,
              sub.name as subsector_name
       FROM equipment e
       LEFT JOIN sectors s ON e.sector_id = s.id
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN subsectors sub ON e.subsector_id = sub.id
       WHERE e.id = ?`,
      [params.id]
    );

    if (equipment.length === 0) {
      console.log('❌ Equipamento não encontrado');
      return NextResponse.json({
        success: false,
        message: 'Equipamento não encontrado'
      }, { status: 404 });
    }

    console.log('✅ Equipamento encontrado:', equipment[0]);
    return NextResponse.json({
      success: true,
      data: equipment[0]
    });
  } catch (error) {
    console.error('❌ Erro ao buscar equipamento:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar equipamento
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ DELETE /api/equipment/[id] - Deletando equipamento...');
    console.log('📊 ID do equipamento:', params.id);

    // Verificar se o equipamento existe
    const existing = await query('SELECT id FROM equipment WHERE id = ?', [params.id]);
    if (existing.length === 0) {
      console.log('❌ Equipamento não encontrado');
      return NextResponse.json({
        success: false,
        message: 'Equipamento não encontrado'
      }, { status: 404 });
    }

    // Verificar dependências que impedem a exclusão
    console.log('🔍 Verificando dependências...');
    
    // Verificar ordens de serviço
    const serviceOrders = await query(
      'SELECT COUNT(*) as count FROM service_orders WHERE equipment_id = ?',
      [params.id]
    );
    
    // Verificar agendamentos de manutenção
    const maintenanceSchedules = await query(
      'SELECT COUNT(*) as count FROM maintenance_schedules WHERE equipment_id = ?',
      [params.id]
    );
    
    // Verificar alertas
    const alerts = await query(
      'SELECT COUNT(*) as count FROM alerts WHERE equipment_id = ?',
      [params.id]
    );

    // Verificar histórico de manutenção através de service_orders
    const maintenanceHistory = await query(
      'SELECT COUNT(*) as count FROM maintenance_history mh INNER JOIN service_orders so ON mh.service_order_id = so.id WHERE so.equipment_id = ?',
      [params.id]
    );

    const totalDependencies = 
      (serviceOrders[0]?.count || 0) + 
      (maintenanceSchedules[0]?.count || 0) + 
      (alerts[0]?.count || 0) + 
      (maintenanceHistory[0]?.count || 0);

    if (totalDependencies > 0) {
      console.log('❌ Equipamento possui dependências:', {
        serviceOrders: serviceOrders[0]?.count || 0,
        maintenanceSchedules: maintenanceSchedules[0]?.count || 0,
        alerts: alerts[0]?.count || 0,
        maintenanceHistory: maintenanceHistory[0]?.count || 0
      });

      const dependencies = [];
      if (serviceOrders[0]?.count > 0) dependencies.push(`${serviceOrders[0].count} ordem(ns) de serviço`);
      if (maintenanceSchedules[0]?.count > 0) dependencies.push(`${maintenanceSchedules[0].count} agendamento(s) de manutenção`);
      if (alerts[0]?.count > 0) dependencies.push(`${alerts[0].count} alerta(s)`);
      if (maintenanceHistory[0]?.count > 0) dependencies.push(`${maintenanceHistory[0].count} registro(s) de histórico`);

      return NextResponse.json({
        success: false,
        message: `Não é possível excluir este equipamento pois ele possui: ${dependencies.join(', ')}. Para excluir o equipamento, primeiro remova ou transfira essas dependências.`
      }, { status: 409 });
    }

    console.log('✅ Nenhuma dependência encontrada, prosseguindo com a exclusão...');

    // Deletar o equipamento
    await query('DELETE FROM equipment WHERE id = ?', [params.id]);

    console.log('✅ Equipamento deletado com sucesso');

    return NextResponse.json({
      success: true,
      message: 'Equipamento deletado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao deletar equipamento:', error);
    console.error('❌ Stack trace:', error.stack);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor', error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Atualizar equipamento usando abordagem alternativa
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 PUT /api/equipment/[id] - Iniciando atualização (ALTERNATIVA)...');
    console.log('📊 ID do equipamento:', params.id);

    // Usar ReadableStream para ler o body sem causar o erro do NextRequest
    let body = {};
    
    try {
      const reader = request.body?.getReader();
      if (reader) {
        const chunks = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            chunks.push(value);
          }
        }
        
        if (chunks.length > 0) {
          const bodyText = new TextDecoder().decode(
            new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []))
          );
          
          if (bodyText.trim()) {
            body = JSON.parse(bodyText);
            console.log('✅ Body parseado via ReadableStream:', body);
          } else {
            throw new Error('Body vazio');
          }
        } else {
          throw new Error('Nenhum dado recebido');
        }
      } else {
        throw new Error('Request body não disponível');
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
    } = body;

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
      message: 'Equipamento atualizado com sucesso'
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