import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Função para normalizar tipos de recorrência
function normalizeRecurrenceType(type: string): string {
  const typeMap: { [key: string]: string } = {
    'none': 'none',
    'nao_repetir': 'none',
    'única': 'none',
    'daily': 'daily',
    'diariamente': 'daily',
    'diária': 'daily',
    'todos_os_dias': 'daily',
    'weekly': 'weekly',
    'semanalmente': 'weekly',
    'semanal': 'weekly',
    'a_cada_semana': 'weekly',
    'monthly': 'monthly',
    'mensalmente': 'monthly',
    'mensal': 'monthly',
    'a_cada_mes': 'monthly',
    'yearly': 'yearly',
    'anualmente': 'yearly',
    'anual': 'yearly',
    'a_cada_ano': 'yearly'
  };
  
  const normalized = typeMap[type.toLowerCase()] || type;
  console.log(`🔄 [NORMALIZE] "${type}" -> "${normalized}"`);
  return normalized;
}

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

    console.log('📊 [AGENDAMENTOS API] Parâmetros recebidos:', {
      page, limit, status, equipment_id, assigned_user_id, 
      start_date, end_date, priority, search
    });

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

    console.log('🔗 [AGENDAMENTOS API] Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ [AGENDAMENTOS API] Conexão estabelecida com sucesso');

    // Query principal para buscar agendamentos
    const mainQuery = `
      SELECT 
        ms.*,
        e.name as equipment_name,
        e.model as equipment_model,
        e.serial_number as equipment_serial,
        e.patrimonio_number as equipment_patrimonio_number,
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

    console.log('🔍 [AGENDAMENTOS API] Executando query principal:', mainQuery);
    console.log('🔍 [AGENDAMENTOS API] Parâmetros da query principal:', [...queryParams, limit, offset]);

    const [schedules] = await connection.execute(mainQuery, [...queryParams, limit, offset]);
    console.log('✅ [AGENDAMENTOS API] Query principal executada com sucesso');
    
    console.log('🔍 [AGENDAMENTOS API] Executando query de contagem:', countQuery);
    console.log('🔍 [AGENDAMENTOS API] Parâmetros da query de contagem:', queryParams);
    
    const [countResult] = await connection.execute(countQuery, queryParams);
    console.log('✅ [AGENDAMENTOS API] Query de contagem executada com sucesso');
    
    const total = (countResult as any)[0]?.total || 0;

    console.log(`📊 [AGENDAMENTOS API] Encontrados ${(schedules as any[]).length} agendamentos de um total de ${total}`);

    // Formatar datas e adicionar informações extras
    console.log('🔄 [AGENDAMENTOS API] Formatando dados dos agendamentos...');
    const formattedSchedules = (schedules as any[]).map(item => ({
      ...item,
      scheduled_date: formatDateBR(item.scheduled_date),
      completion_date: item.completion_date ? formatDateBR(item.completion_date) : null,
      created_at: formatDateBR(item.created_at),
      updated_at: formatDateBR(item.updated_at),
      is_overdue: new Date(item.scheduled_date) < new Date() && item.status === 'pending'
    }));

    console.log('✅ [AGENDAMENTOS API] Dados formatados com sucesso');
    console.log('📤 [AGENDAMENTOS API] Retornando resposta para o cliente');

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
    console.error('❌ [AGENDAMENTOS API] Stack trace:', (error as Error).stack);
    console.error('❌ [AGENDAMENTOS API] Tipo do erro:', typeof error);
    console.error('❌ [AGENDAMENTOS API] Propriedades do erro:', Object.keys(error as any));
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor ao buscar agendamentos'
    }, { status: 500 });
  } finally {
    if (connection) {
      console.log('🔌 [AGENDAMENTOS API] Fechando conexão com o banco de dados');
      await connection.end();
      console.log('✅ [AGENDAMENTOS API] Conexão fechada com sucesso');
    }
  }
}

// POST - Criar novo agendamento
// Função para calcular datas de recorrência
function calculateRecurrenceDates(
  startDate: Date,
  recurrenceType: string,
  recurrenceInterval: number,
  durationType: string,
  durationValue: number,
  endDate?: Date
): Date[] {
  const dates: Date[] = [];
  
  console.log('🔄 [RECORRÊNCIA] Iniciando cálculo:', {
    startDate: startDate.toISOString(),
    recurrenceType,
    recurrenceInterval,
    durationType,
    durationValue,
    endDate: endDate?.toISOString()
  });

  // Adicionar a primeira data
  dates.push(new Date(startDate));
  console.log('📅 [RECORRÊNCIA] Primeira data adicionada:', startDate.toISOString());

  // Se não há recorrência, retornar apenas a data inicial
  if (recurrenceType === 'none' || recurrenceType === 'única' || recurrenceType === 'nao_repetir') {
    console.log('✅ [RECORRÊNCIA] Sem recorrência - retornando apenas data inicial');
    return dates;
  }

  // Normalizar tipo de recorrência para garantir compatibilidade
  const normalizedType = normalizeRecurrenceType(recurrenceType);
  console.log('🔄 [RECORRÊNCIA] Tipo normalizado:', normalizedType);

  // Calcular data final baseada no tipo de duração
  let finalDate: Date | null = null;
  
  if (durationType === 'months' && durationValue > 0) {
    finalDate = new Date(startDate);
    finalDate.setMonth(finalDate.getMonth() + durationValue);
  } else if (durationType === 'weeks' && durationValue > 0) {
    finalDate = new Date(startDate);
    finalDate.setDate(finalDate.getDate() + (durationValue * 7));
  } else if (durationType === 'end_date' && endDate) {
    finalDate = new Date(endDate);
  }

  console.log('📅 Data final calculada:', finalDate?.toISOString());

  // Gerar datas de recorrência
  let occurrenceCount = 1; // Já temos a primeira data
  const maxOccurrences = durationType === 'occurrences' ? durationValue : 100; // Limite de segurança reduzido

  // CORREÇÃO: Usar uma nova instância de data para cada iteração
  let currentDate = new Date(startDate);

  while (occurrenceCount < maxOccurrences) {
    // CORREÇÃO: Calcular próxima data baseada no tipo de recorrência
    // Criar uma nova data para evitar mutação da data anterior
    let nextDate = new Date(currentDate);
    
    switch (normalizedType) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + recurrenceInterval);
        console.log(`📅 [RECORRÊNCIA] Calculando próxima data diária: +${recurrenceInterval} dias`);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (recurrenceInterval * 7));
        console.log(`📅 [RECORRÊNCIA] Calculando próxima data semanal: +${recurrenceInterval * 7} dias`);
        break;
      case 'monthly':
        // Método mais seguro para adicionar meses, lidando corretamente com mudança de ano e dias do mês
        const originalDay = nextDate.getDate();
        const currentMonth = nextDate.getMonth();
        const currentYear = nextDate.getFullYear();
        
        // Calcular novo mês e ano de forma mais segura
        let newMonth = currentMonth + recurrenceInterval;
        let newYear = currentYear;
        
        // Ajustar ano se necessário
        while (newMonth >= 12) {
          newMonth -= 12;
          newYear += 1;
        }
        while (newMonth < 0) {
          newMonth += 12;
          newYear -= 1;
        }
        
        // Verificar se o dia original é válido no novo mês
        const daysInNewMonth = new Date(newYear, newMonth + 1, 0).getDate();
        const validDay = originalDay > daysInNewMonth ? daysInNewMonth : originalDay;
        
        // Criar nova data de forma segura
        nextDate = new Date(newYear, newMonth, validDay);
        
        // Verificar se a data criada é válida
        if (isNaN(nextDate.getTime())) {
          console.log('❌ [RECORRÊNCIA] Data inválida calculada na recorrência mensal, parando');
          return dates;
        }
        
        console.log(`📅 [RECORRÊNCIA] Recorrência mensal: ${currentYear}-${currentMonth + 1}-${originalDay} -> ${newYear}-${newMonth + 1}-${validDay}`);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + recurrenceInterval);
        console.log(`📅 [RECORRÊNCIA] Calculando próxima data anual: +${recurrenceInterval} anos`);
        break;
      default:
        console.log('❌ [RECORRÊNCIA] Tipo não reconhecido após normalização:', normalizedType, 'original:', recurrenceType);
        return dates;
    }

    // Atualizar currentDate para a próxima iteração
    currentDate = nextDate;

    // Verificar se deve parar baseado no tipo de duração
    if (durationType === 'occurrences') {
      // Para número específico de ocorrências
      if (occurrenceCount >= durationValue) {
        console.log(`✅ Limite de ${durationValue} ocorrências atingido`);
        break;
      }
    } else if (finalDate) {
      // Para duração por tempo ou data específica
      if (currentDate > finalDate) {
        console.log('✅ Data final atingida:', finalDate.toISOString());
        break;
      }
    } else if (durationType === 'indefinite') {
      // Para indefinido, criar apenas algumas ocorrências (ex: próximos 12 meses)
      const oneYearFromStart = new Date(startDate);
      oneYearFromStart.setFullYear(oneYearFromStart.getFullYear() + 1);
      if (currentDate > oneYearFromStart) {
        console.log('✅ Limite de 1 ano para indefinido atingido');
        break;
      }
    }

    dates.push(new Date(currentDate));
    occurrenceCount++;

    console.log(`📅 [RECORRÊNCIA] Adicionada data ${occurrenceCount}: ${currentDate.toISOString()}`);

    // Limite de segurança para evitar loops infinitos
    if (dates.length > 50) {
      console.log('⚠️ [RECORRÊNCIA] Limite de 50 ocorrências atingido por segurança');
      break;
    }
  }

  console.log(`✅ [RECORRÊNCIA] Calculadas ${dates.length} datas total para tipo "${normalizedType}"`);
  console.log('📋 [RECORRÊNCIA] Datas calculadas:', dates.map(d => d.toISOString()));
  return dates;
}

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
      observations,
      recurrenceType = 'none',
      recurrenceInterval = 1,
      recurrenceEndDate,
      recurrenceDurationType = 'indefinite',
      recurrenceDurationValue = 1
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

    // Calcular datas de recorrência
    const startDate = new Date(scheduled_date);
    const endDate = recurrenceEndDate ? new Date(recurrenceEndDate) : undefined;
    
    const recurrenceDates = calculateRecurrenceDates(
      startDate,
      recurrenceType,
      recurrenceInterval,
      recurrenceDurationType,
      recurrenceDurationValue,
      endDate
    );

    console.log(`📅 Criando ${recurrenceDates.length} agendamentos`);

    // Preparar query de inserção
    const insertQuery = `
      INSERT INTO maintenance_schedules (
        equipment_id, maintenance_type, description, scheduled_date, 
        priority, assigned_user_id, estimated_cost, created_by, 
        maintenance_plan_id, company_id, observations, status,
        recurrence_type, recurrence_interval, recurrence_end_date,
        recurrence_duration_type, recurrence_duration_value, parent_schedule_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const createdSchedules = [];
    let parentScheduleId = null;

    // Criar agendamentos para cada data calculada
    for (let i = 0; i < recurrenceDates.length; i++) {
      const currentDate = recurrenceDates[i];
      const isParent = i === 0; // O primeiro agendamento é o "pai"
      
      const [result] = await connection.execute(insertQuery, [
        equipment_id,
        maintenance_type,
        description,
        formatDateISO(currentDate),
        priority,
        assigned_user_id || null,
        estimated_cost || null,
        created_by,
        maintenance_plan_id || null,
        company_id || null,
        observations || null,
        'AGENDADA',
        recurrenceType,
        recurrenceInterval,
        recurrenceEndDate ? formatDateISO(recurrenceEndDate) : null,
        recurrenceDurationType,
        recurrenceDurationValue,
        isParent ? null : parentScheduleId // Agendamentos filhos referenciam o pai
      ]);

      const insertId = (result as any).insertId;
      
      // O primeiro agendamento criado é o pai
      if (isParent) {
        parentScheduleId = insertId;
      }

      console.log(`✅ Agendamento ${i + 1}/${recurrenceDates.length} criado com ID: ${insertId}`);
      createdSchedules.push(insertId);
    }

    // Buscar o agendamento principal (pai) com dados completos
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
    `, [parentScheduleId]);

    const schedule = (createdSchedule as any[])[0];
    const formattedSchedule = {
      ...schedule,
      scheduled_date: formatDateBR(schedule.scheduled_date),
      completion_date: schedule.completion_date ? formatDateBR(schedule.completion_date) : null,
      created_at: formatDateBR(schedule.created_at),
      updated_at: formatDateBR(schedule.updated_at),
      total_occurrences: createdSchedules.length
    };

    const message = recurrenceDates.length > 1 
      ? `Agendamento recorrente criado com sucesso! ${recurrenceDates.length} ocorrências geradas.`
      : 'Agendamento criado com sucesso';

    return NextResponse.json({
      success: true,
      data: formattedSchedule,
      message,
      created_schedules: createdSchedules
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