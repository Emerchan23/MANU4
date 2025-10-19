import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance',
  charset: 'utf8mb4'
}

// Função auxiliar para formatar datas
function formatDateBR(date: any) {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateISO(date: any) {
  if (!date) return null;
  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

// GET - Listar agendamentos
export async function GET(request: NextRequest) {
  let connection;
  
  try {
    console.log('🔍 [AGENDAMENTOS API] Iniciando busca de agendamentos');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const equipment_id = searchParams.get('equipment_id');
    const assigned_user_id = searchParams.get('assigned_user_id');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];

    // Filtros
    if (status) {
      whereConditions.push('ms.status = ?');
      queryParams.push(status);
    }

    if (equipment_id) {
      whereConditions.push('ms.equipment_id = ?');
      queryParams.push(equipment_id);
    }

    if (assigned_user_id) {
      whereConditions.push('ms.assigned_user_id = ?');
      queryParams.push(assigned_user_id);
    }

    if (start_date) {
      whereConditions.push('DATE(ms.scheduled_date) >= ?');
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push('DATE(ms.scheduled_date) <= ?');
      queryParams.push(end_date);
    }

    if (priority) {
      whereConditions.push('ms.priority = ?');
      queryParams.push(priority);
    }

    if (search) {
      whereConditions.push(`(
        e.name LIKE ? OR 
        e.patrimonio LIKE ? OR 
        ms.description LIKE ? OR
        u.full_name LIKE ?
      )`);
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    connection = await mysql.createConnection(dbConfig);

    // Query principal para buscar agendamentos
    const mainQuery = `
      SELECT 
        ms.*,
        e.name as equipment_name,
        e.model as equipment_model,
        e.serial_number as equipment_serial,
        e.patrimonio as equipment_patrimonio_number,
        u.full_name as assigned_user_name,
        u.email as assigned_user_email,
        creator.full_name as created_by_name,
        c.name as company_name,
        mp.name as maintenance_plan_name
      FROM maintenance_schedules ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN users u ON ms.assigned_user_id = u.id
      LEFT JOIN users creator ON ms.created_by = creator.id
      LEFT JOIN companies c ON ms.company_id = c.id
      LEFT JOIN maintenance_plans mp ON ms.maintenance_plan_id = mp.id
      ${whereClause}
      ORDER BY ms.scheduled_date DESC
      LIMIT ? OFFSET ?
    `;

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM maintenance_schedules ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN users u ON ms.assigned_user_id = u.id
      LEFT JOIN companies c ON ms.company_id = c.id
      LEFT JOIN maintenance_plans mp ON ms.maintenance_plan_id = mp.id
      ${whereClause}
    `;

    console.log('🔍 [AGENDAMENTOS API] Executando query:', mainQuery);
    console.log('🔍 [AGENDAMENTOS API] Parâmetros:', [...queryParams, limit, offset]);

    const [schedules] = await connection.execute(mainQuery, [...queryParams, limit, offset]);
    const [countResult] = await connection.execute(countQuery, queryParams);
    const total = (countResult as any)[0]?.total || 0;

    console.log(`📊 [AGENDAMENTOS API] Encontrados ${(schedules as any[]).length} agendamentos`);

    // Formatar datas e adicionar informações extras
    const formattedSchedules = (schedules as any[]).map(item => ({
      ...item,
      scheduled_date: formatDateBR(item.scheduled_date),
      completion_date: item.completion_date ? formatDateBR(item.completion_date) : null,
      created_at: formatDateBR(item.created_at),
      updated_at: formatDateBR(item.updated_at),
      is_overdue: new Date(item.scheduled_date) < new Date() && item.status === 'pending'
    }));

    return NextResponse.json({
      success: true,
      data: formattedSchedules,
      pagination: {
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ [AGENDAMENTOS API] Erro ao buscar agendamentos:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor ao buscar agendamentos'
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// POST - Criar novo agendamento
export async function POST(request: NextRequest) {
  let connection;
  
  try {
    console.log('🔧 [AGENDAMENTOS API] Criando novo agendamento');
    
    const body = await request.json();
    console.log('📊 [AGENDAMENTOS API] Dados recebidos:', body);

    const {
      equipment_id,
      maintenance_type,
      description,
      scheduled_date,
      priority = 'media',
      assigned_user_id,
      estimated_cost,
      created_by = 1, // TODO: Pegar do contexto de autenticação
      maintenance_plan_id,
      company_id,
      observations
    } = body;

    // Validações básicas
    if (!equipment_id || !maintenance_type || !description || !scheduled_date) {
      return NextResponse.json({
        success: false,
        error: 'Campos obrigatórios: equipment_id, maintenance_type, description, scheduled_date'
      }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);

    // Verificar se o equipamento existe
    const [equipmentCheck] = await connection.execute(
      'SELECT id FROM equipment WHERE id = ?',
      [equipment_id]
    );

    if ((equipmentCheck as any[]).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Equipamento não encontrado'
      }, { status: 404 });
    }

    // Verificar se o usuário atribuído existe (se fornecido)
    if (assigned_user_id) {
      const [userCheck] = await connection.execute(
        'SELECT id FROM users WHERE id = ?',
        [assigned_user_id]
      );

      if ((userCheck as any[]).length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Usuário atribuído não encontrado'
        }, { status: 404 });
      }
    }

    // Inserir agendamento
    const insertQuery = `
      INSERT INTO maintenance_schedules (
        equipment_id, maintenance_type, description, scheduled_date, 
        priority, assigned_user_id, estimated_cost, created_by, 
        maintenance_plan_id, company_id, observations
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(insertQuery, [
      equipment_id,
      maintenance_type,
      description,
      formatDateISO(scheduled_date),
      priority,
      assigned_user_id || null,
      estimated_cost || null,
      created_by,
      maintenance_plan_id || null,
      company_id || null,
      observations || null
    ]);

    const insertId = (result as any).insertId;
    console.log('✅ [AGENDAMENTOS API] Agendamento criado com ID:', insertId);

    // Buscar o agendamento criado com dados completos
    const [createdSchedule] = await connection.execute(`
      SELECT 
        ms.*,
        e.name as equipment_name,
        e.model as equipment_model,
        u.full_name as assigned_user_name,
        creator.full_name as created_by_name
      FROM maintenance_schedules ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN users u ON ms.assigned_user_id = u.id
      LEFT JOIN users creator ON ms.created_by = creator.id
      WHERE ms.id = ?
    `, [insertId]);

    const schedule = (createdSchedule as any[])[0];
    const formattedSchedule = {
      ...schedule,
      scheduled_date: formatDateBR(schedule.scheduled_date),
      completion_date: schedule.completion_date ? formatDateBR(schedule.completion_date) : null,
      created_at: formatDateBR(schedule.created_at),
      updated_at: formatDateBR(schedule.updated_at)
    };

    return NextResponse.json({
      success: true,
      data: formattedSchedule,
      message: 'Agendamento criado com sucesso'
    });

  } catch (error) {
    console.error('❌ [AGENDAMENTOS API] Erro ao criar agendamento:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor ao criar agendamento'
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}