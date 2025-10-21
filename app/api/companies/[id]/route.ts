import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Configuração do banco de dados MariaDB
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
  timezone: '+00:00'
};

export async function GET(request: Request, { params }: { params: { id: string } }) {
  let connection: any = null;
  
  try {
    const { id } = params;
    console.log('🔍 GET /api/companies/[id] - Buscando empresa:', id);

    connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(
      'SELECT * FROM companies WHERE id = ?',
      [id]
    );
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      company: rows[0]
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar empresa:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// DELETE - Deletar empresa
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  let connection: any = null;
  
  try {
    const { id } = params;
    console.log('🗑️ DELETE /api/companies/[id] - Deletando empresa...');
    console.log('📊 ID da empresa:', id);

    connection = await mysql.createConnection(dbConfig);

    // Verificar se a empresa existe
    const [existing] = await connection.execute('SELECT id FROM companies WHERE id = ?', [id]);
    if (!Array.isArray(existing) || existing.length === 0) {
      console.log('❌ Empresa não encontrada');
      return NextResponse.json({
        success: false,
        message: 'Empresa não encontrada'
      }, { status: 404 });
    }

    // Verificar dependências que impedem a exclusão
    console.log('🔍 Verificando dependências...');
    
    // Verificar ordens de serviço
    const [serviceOrders] = await connection.execute(
      'SELECT COUNT(*) as count FROM service_orders WHERE company_id = ?',
      [id]
    );
    
    // Verificar equipamentos
    const [equipment] = await connection.execute(
      'SELECT COUNT(*) as count FROM equipment WHERE company_id = ?',
      [id]
    );
    
    // Verificar agendamentos de manutenção diretamente pela company_id
    const [maintenanceSchedules] = await connection.execute(
      'SELECT COUNT(*) as count FROM maintenance_schedules WHERE company_id = ?',
      [id]
    );

    // Verificar alertas através de equipamentos
    const [alerts] = await connection.execute(
      'SELECT COUNT(*) as count FROM alerts a INNER JOIN equipment e ON a.equipment_id = e.id WHERE e.company_id = ?',
      [id]
    );

    const totalDependencies = 
      (serviceOrders[0]?.count || 0) + 
      (equipment[0]?.count || 0) + 
      (maintenanceSchedules[0]?.count || 0) + 
      (alerts[0]?.count || 0);

    if (totalDependencies > 0) {
      console.log('❌ Empresa possui dependências:', {
        serviceOrders: serviceOrders[0]?.count || 0,
        equipment: equipment[0]?.count || 0,
        maintenanceSchedules: maintenanceSchedules[0]?.count || 0,
        alerts: alerts[0]?.count || 0
      });

      const dependencies = [];
      if (serviceOrders[0]?.count > 0) dependencies.push(`${serviceOrders[0].count} ordem(ns) de serviço`);
      if (equipment[0]?.count > 0) dependencies.push(`${equipment[0].count} equipamento(s)`);
      if (maintenanceSchedules[0]?.count > 0) dependencies.push(`${maintenanceSchedules[0].count} agendamento(s) de manutenção`);
      if (alerts[0]?.count > 0) dependencies.push(`${alerts[0].count} alerta(s)`);

      return NextResponse.json({
        success: false,
        message: `Não é possível excluir esta empresa pois ela possui: ${dependencies.join(', ')}. Para excluir a empresa, primeiro remova ou transfira essas dependências.`
      }, { status: 409 });
    }

    console.log('✅ Nenhuma dependência encontrada, prosseguindo com a exclusão...');

    // Deletar a empresa
    const [deleteResult] = await connection.execute('DELETE FROM companies WHERE id = ?', [id]);

    console.log('✅ Empresa deletada com sucesso');

    return NextResponse.json({
      success: true,
      message: 'Empresa deletada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao deletar empresa:', error);
    console.error('❌ Stack trace:', error.stack);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor', error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('❌ Erro ao fechar conexão:', closeError);
      }
    }
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  let connection: any = null;
  
  try {
    const { id } = params;
    console.log('🔄 PUT /api/companies/[id] - Atualizando empresa:', id);

    // Ler o body da requisição usando método alternativo para evitar conflito
    let body;
    try {
      const bodyText = await request.text();
      body = JSON.parse(bodyText);
      console.log('📊 Dados recebidos:', body);
    } catch (parseError) {
      console.error('❌ Erro ao processar body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Dados inválidos na requisição' },
        { status: 400 }
      );
    }

    // Validação básica
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    // Conectar ao banco
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');

    // Verificar se a empresa existe
    const [existingCompany] = await connection.execute(
      'SELECT id FROM companies WHERE id = ?',
      [id]
    );
    
    if (!Array.isArray(existingCompany) || existingCompany.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    // Construir query de atualização dinamicamente
    const updates = [];
    const queryParams = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      queryParams.push(body.name);
    }
    if (body.cnpj !== undefined) {
      updates.push('cnpj = ?');
      queryParams.push(body.cnpj);
    }
    if (body.address !== undefined) {
      updates.push('address = ?');
      queryParams.push(body.address);
    }
    if (body.phone !== undefined) {
      updates.push('phone = ?');
      queryParams.push(body.phone);
    }
    if (body.email !== undefined) {
      updates.push('email = ?');
      queryParams.push(body.email);
    }
    if (body.contact_person !== undefined) {
      updates.push('contact_person = ?');
      queryParams.push(body.contact_person);
    }
    if (body.active !== undefined) {
      updates.push('active = ?');
      queryParams.push(body.active);
    }
    if (body.specialties !== undefined) {
      updates.push('specialties = ?');
      queryParams.push(body.specialties);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    // Adicionar updated_at e o ID no final
    updates.push('updated_at = CURRENT_TIMESTAMP');
    queryParams.push(id);

    const updateQuery = `UPDATE companies SET ${updates.join(', ')} WHERE id = ?`;
    console.log('📊 Query de atualização:', updateQuery);
    console.log('📊 Parâmetros:', queryParams);

    const [updateResult] = await connection.execute(updateQuery, queryParams);
    console.log('✅ Resultado da atualização:', updateResult);

    if ((updateResult as any).affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhuma linha foi atualizada' },
        { status: 400 }
      );
    }

    // Buscar a empresa atualizada
    const [updatedCompany] = await connection.execute(
      'SELECT * FROM companies WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      data: (updatedCompany as any[])[0],
      message: 'Empresa atualizada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar empresa:', error);
    
    // Garantir que sempre retornamos um JSON válido
    try {
      return NextResponse.json(
        { success: false, error: 'Erro interno do servidor: ' + (error?.message || 'Erro desconhecido') },
        { status: 500 }
      );
    } catch (jsonError) {
      console.error('❌ Erro ao criar resposta JSON:', jsonError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('❌ Erro ao fechar conexão:', closeError);
      }
    }
  }
}