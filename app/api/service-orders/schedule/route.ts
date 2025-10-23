import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import { formatDateBR, formatDateISO, addDays, isOverdue } from '@/lib/date-utils-br'

// Configuração do banco de dados MariaDB
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00',
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 10000
}

// GET - Buscar agendamentos de manutenção
export async function GET(request: NextRequest) {
  let connection;
  try {
    console.log('🔄 API /api/service-orders/schedule - Iniciando busca de agendamentos...');
    
    const { searchParams } = new URL(request.url)
    const equipmentId = searchParams.get('equipmentId')
    const companyId = searchParams.get('companyId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const overdue = searchParams.get('overdue')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    console.log('📊 Parâmetros:', { equipmentId, companyId, startDate, endDate, status, overdue, page, limit });

    // Conectar ao MariaDB
    connection = await mysql.createConnection(dbConfig);

    // Verificar se a tabela maintenance_schedules existe
    const [tableCheck] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'maintenance_schedules'
    `, [dbConfig.database]);

    if (tableCheck[0].count === 0) {
      console.log('❌ Tabela maintenance_schedules não existe, criando...');
      
      // Criar tabela maintenance_schedules
      await connection.execute(`
        CREATE TABLE maintenance_schedules (
          id INT(11) NOT NULL AUTO_INCREMENT,
          equipment_id INT(11) NOT NULL,
          maintenance_plan_id INT(11) NULL,
          scheduled_date DATE NOT NULL,
          completion_date DATE NULL,
          status ENUM('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
          priority ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
          assigned_to INT(11) NULL,
          description TEXT NULL,
          observations TEXT NULL,
          created_by INT(11) NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          INDEX idx_equipment_id (equipment_id),
          INDEX idx_scheduled_date (scheduled_date),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ Tabela maintenance_schedules criada');
    }

    // Construir query com filtros
    let whereConditions = []
    let queryParams = []

    if (equipmentId) {
      whereConditions.push('ms.equipment_id = ?')
      queryParams.push(equipmentId)
    }

    if (companyId) {
      whereConditions.push('e.company_id = ?')
      queryParams.push(companyId)
    }

    if (startDate) {
      whereConditions.push('ms.scheduled_date >= ?')
      queryParams.push(formatDateISO(new Date(startDate)))
    }

    if (endDate) {
      whereConditions.push('ms.scheduled_date <= ?')
      queryParams.push(formatDateISO(new Date(endDate)))
    }

    if (status) {
      whereConditions.push('ms.status = ?')
      queryParams.push(status)
    }

    if (overdue === 'true') {
      whereConditions.push('ms.scheduled_date < CURDATE() AND ms.status = "pending"')
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Query para contar total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM maintenance_schedules ms
      ${whereClause}
    `

    const [countResult] = await connection.execute(countQuery, queryParams)
    const total = countResult[0].total

    // Query principal com paginação (sem joins complexos por enquanto)
    const scheduleQuery = `
      SELECT 
        ms.*,
        'N/A' as equipment_name,
        'N/A' as equipment_model,
        'N/A' as equipment_serial,
        'N/A' as company_name,
        'N/A' as created_by_name,
        'N/A' as assigned_to_name
      FROM maintenance_schedules ms
      ${whereClause}
      ORDER BY ms.scheduled_date ASC, ms.priority DESC
      LIMIT ? OFFSET ?
    `

    queryParams.push(limit, offset)
    const [schedules] = await connection.execute(scheduleQuery, queryParams)

    console.log('📊 Agendamentos encontrados:', schedules.length);

    // Formatar datas e adicionar informações de status
    const formattedSchedules = schedules.map(item => ({
      ...item,
      scheduled_date: formatDateBR(item.scheduled_date),
      completion_date: item.completion_date ? formatDateBR(item.completion_date) : null,
      created_at: formatDateBR(item.created_at),
      updated_at: formatDateBR(item.updated_at),
      is_overdue: isOverdue(item.scheduled_date) && item.status === 'pending'
    }))

    return NextResponse.json({
      success: true,
      data: formattedSchedules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('❌ Erro ao buscar agendamentos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor ao buscar agendamentos' },
      { status: 500 }
    )
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
    console.log('🔄 API /api/service-orders/schedule - Criando novo agendamento...');
    
    const body = await request.json()
    const {
      equipmentId,
      maintenanceType,
      description,
      scheduledDate,
      priority = 'medium',
      assignedTo,
      estimatedValue,
      companyId,
      observations,
      recurrenceType = 'none',
      recurrenceInterval = 0,
      createdBy,
      maintenancePlanId,
      recurrenceDurationType,
      recurrenceDurationValue,
      recurrenceEndDate
    } = body

    console.log('📊 Dados recebidos:', { 
      equipmentId, maintenanceType, description, scheduledDate, priority,
      estimatedValue, companyId, observations, recurrenceType, recurrenceInterval,
      recurrenceDurationType, recurrenceDurationValue, recurrenceEndDate
    });

    // Conectar ao MariaDB
    connection = await mysql.createConnection(dbConfig);

    // Mapear prioridade para o formato do banco (aceitar valores em português)
    const priorityMap: { [key: string]: string } = {
      'baixa': 'baixa',
      'media': 'media', 
      'alta': 'alta',
      'critica': 'critica',
      // Manter compatibilidade com valores antigos em inglês
      'low': 'baixa',
      'medium': 'media',
      'high': 'alta',
      'critical': 'critica'
    }

    const dbPriority = priorityMap[priority] || 'media'

    // Validações obrigatórias
    if (!equipmentId || !description || !scheduledDate) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios não preenchidos (equipmentId, description, scheduledDate)' },
        { status: 400 }
      )
    }

    // Verificar se o equipamento existe
    const [equipmentExists] = await connection.execute('SELECT id FROM equipment WHERE id = ?', [equipmentId])
    
    if (equipmentExists.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Equipamento não encontrado' },
        { status: 404 }
      )
    }

    // Inserir agendamento
    const insertQuery = `
      INSERT INTO maintenance_schedules (
        equipment_id, description, scheduled_date, priority, 
        assigned_user_id, created_by, maintenance_plan_id, estimated_cost, company_id, observations,
        recurrence_type, recurrence_interval
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    // Validar e processar a data
    let processedDate;
    try {
      const dateObj = new Date(scheduledDate);
      if (isNaN(dateObj.getTime())) {
        console.error('❌ Data inválida recebida:', scheduledDate);
        return NextResponse.json(
          { success: false, error: 'Data agendada inválida' },
          { status: 400 }
        );
      }
      processedDate = dateObj.toISOString().slice(0, 19).replace('T', ' ');
    } catch (error) {
      console.error('❌ Erro ao processar data:', error, 'Data recebida:', scheduledDate);
      return NextResponse.json(
        { success: false, error: 'Erro ao processar data agendada' },
        { status: 400 }
      );
    }

    console.log('💾 Salvando dados:', {
      equipmentId,
      description,
      scheduledDate: processedDate,
      dbPriority,
      assignedTo: assignedTo || null,
      createdBy: createdBy || 1,
      maintenancePlanId: maintenancePlanId && maintenancePlanId !== 'none' && maintenancePlanId !== '' ? parseInt(maintenancePlanId) : null,
      estimatedValue: estimatedValue || null,
      companyId: companyId || null,
      observations: observations || null
    });

    const [result] = await connection.execute(insertQuery, [
      equipmentId,
      description,
      processedDate,
      dbPriority,
      assignedTo || null,
      createdBy || 1,
      maintenancePlanId && maintenancePlanId !== 'none' && maintenancePlanId !== '' ? parseInt(maintenancePlanId) : null,
      estimatedValue || null,
      companyId || null,
      observations || null,
      recurrenceType,
      recurrenceInterval
    ])

    console.log('✅ Agendamento inserido com ID:', result.insertId);

    // Criar agendamentos recorrentes se necessário
    let totalCreated = 1; // Já criamos o agendamento principal
    if (recurrenceType && recurrenceType !== 'none') {
      console.log('🔄 Criando agendamentos recorrentes...');
      const additionalCreated = await createRecurringSchedules(result.insertId, {
        equipmentId,
        maintenanceType,
        description,
        scheduledDate,
        priority: dbPriority,
        assignedTo,
        estimatedValue,
        maintenancePlanId: maintenancePlanId && maintenancePlanId !== 'none' && maintenancePlanId !== '' ? parseInt(maintenancePlanId) : null,
        recurrenceType,
        recurrenceInterval,
        createdBy: createdBy || 1,
        recurrenceDurationType: recurrenceDurationType || 'months',
        recurrenceDurationValue: recurrenceDurationValue || 1,
        recurrenceEndDate: recurrenceEndDate || null
      });
      totalCreated += additionalCreated || 0;
    }

    // Buscar agendamento criado
    const [createdSchedule] = await connection.execute(`
      SELECT 
        ms.*,
        e.name as equipment_name,
        c.name as company_name,
        u1.name as created_by_name,
        u2.name as assigned_to_name
      FROM maintenance_schedules ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN companies c ON 1=0
      LEFT JOIN users u1 ON ms.created_by = u1.id
      LEFT JOIN users u2 ON ms.assigned_user_id = u2.id
      WHERE ms.id = ?
    `, [result.insertId])

    const schedule = createdSchedule[0]

    // Formatar datas
    const formattedSchedule = {
      ...schedule,
      scheduled_date: schedule.scheduled_date ? new Date(schedule.scheduled_date).toLocaleDateString('pt-BR') : null,
      created_at: schedule.created_at ? new Date(schedule.created_at).toLocaleDateString('pt-BR') : null,
      updated_at: schedule.updated_at ? new Date(schedule.updated_at).toLocaleDateString('pt-BR') : null
    }

    const message = recurrenceType && recurrenceType !== 'none' 
      ? `Agendamento criado com sucesso! ${totalCreated} agendamentos recorrentes foram gerados.`
      : 'Agendamento criado com sucesso!'

    return NextResponse.json({
      success: true,
      data: formattedSchedule,
      message
    })

  } catch (error) {
    console.error('❌ Erro ao criar agendamento:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor ao criar agendamento' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Função para calcular datas de recorrência com duração específica
function calculateRecurrenceDatesWithDuration(
  startDate: Date,
  recurrenceType: string,
  recurrenceInterval: number,
  durationType: string,
  durationValue: number,
  endDate?: Date
): Date[] {
  const dates: Date[] = [];
  
  console.log('🔄 [SCHEDULE] Calculando recorrência com duração:', {
    startDate: startDate.toISOString(),
    recurrenceType,
    recurrenceInterval,
    durationType,
    durationValue,
    endDate: endDate?.toISOString()
  });

  // Adicionar a primeira data
  dates.push(new Date(startDate));

  // Se não há recorrência, retornar apenas a data inicial
  if (recurrenceType === 'none' || recurrenceType === 'única') {
    console.log('✅ [SCHEDULE] Sem recorrência - retornando apenas data inicial');
    return dates;
  }

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

  console.log('📅 [SCHEDULE] Data final calculada:', finalDate?.toISOString());

  // Gerar datas de recorrência
  let occurrenceCount = 1; // Já temos a primeira data
  const maxOccurrences = durationType === 'occurrences' ? durationValue : 100;

  let currentDate = new Date(startDate);

  while (occurrenceCount < maxOccurrences) {
    // Calcular próxima data baseada no tipo de recorrência
    let nextDate = new Date(currentDate);
    
    switch (recurrenceType) {
      case 'daily':
      case 'diária':
        nextDate.setDate(nextDate.getDate() + recurrenceInterval);
        break;
      case 'weekly':
      case 'semanal':
        nextDate.setDate(nextDate.getDate() + (recurrenceInterval * 7));
        break;
      case 'monthly':
      case 'mensal':
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
          console.log('❌ [SCHEDULE] Data inválida calculada na recorrência mensal, parando');
          return dates;
        }
        
        console.log(`📅 [SCHEDULE] Recorrência mensal: ${currentYear}-${currentMonth + 1}-${originalDay} -> ${newYear}-${newMonth + 1}-${validDay}`);
        break;
      case 'yearly':
      case 'anual':
        nextDate.setFullYear(nextDate.getFullYear() + recurrenceInterval);
        break;
      default:
        console.log('❌ [SCHEDULE] Tipo de recorrência não reconhecido:', recurrenceType);
        return dates;
    }

    // CORREÇÃO CRÍTICA: Verificar se deve parar ANTES de adicionar a data
    if (durationType === 'occurrences') {
      if (occurrenceCount >= durationValue) {
        console.log(`✅ [SCHEDULE] Limite de ${durationValue} ocorrências atingido`);
        break;
      }
    } else if (finalDate) {
      if (nextDate > finalDate) {
        console.log('✅ [SCHEDULE] Próxima data ultrapassaria o limite:', nextDate.toISOString(), '> finalDate:', finalDate.toISOString());
        break;
      }
    } else if (durationType === 'indefinite') {
      const oneYearFromStart = new Date(startDate);
      oneYearFromStart.setFullYear(oneYearFromStart.getFullYear() + 1);
      if (nextDate > oneYearFromStart) {
        console.log('✅ [SCHEDULE] Limite de 1 ano para indefinido atingido');
        break;
      }
    }

    currentDate = nextDate;
    dates.push(new Date(currentDate));
    occurrenceCount++;

    console.log(`📅 [SCHEDULE] Adicionada data ${occurrenceCount}: ${currentDate.toISOString()}`);

    // Limite de segurança
    if (dates.length > 50) {
      console.log('⚠️ [SCHEDULE] Limite de 50 ocorrências atingido por segurança');
      break;
    }
  }

  console.log(`✅ [SCHEDULE] Calculadas ${dates.length} datas total`);
  return dates;
}

// Função auxiliar para criar agendamentos recorrentes
async function createRecurringSchedules(originalId: number, scheduleData: any) {
  let connection;
  try {
    const { 
      equipmentId, maintenanceType, description, scheduledDate, 
      priority, assignedTo, estimatedValue, maintenancePlanId, recurrenceType, recurrenceInterval, createdBy,
      recurrenceDurationType = 'indefinite', recurrenceDurationValue = 1, recurrenceEndDate
    } = scheduleData

    console.log('🔄 [SCHEDULE] Criando agendamentos recorrentes:', {
      recurrenceType, recurrenceInterval, recurrenceDurationType, recurrenceDurationValue
    });
    
    console.log('📋 [SCHEDULE] maintenancePlanId recebido:', maintenancePlanId, 'tipo:', typeof maintenancePlanId);

    connection = await mysql.createConnection(dbConfig);

    // Calcular todas as datas de recorrência usando a lógica corrigida
    const startDate = new Date(scheduledDate);
    const endDate = recurrenceEndDate ? new Date(recurrenceEndDate) : undefined;
    
    const recurrenceDates = calculateRecurrenceDatesWithDuration(
      startDate,
      recurrenceType,
      recurrenceInterval,
      recurrenceDurationType,
      recurrenceDurationValue,
      endDate
    );

    console.log(`📅 [SCHEDULE] Criando ${recurrenceDates.length - 1} agendamentos recorrentes adicionais`);

    let createdCount = 0;
    
    // Criar agendamentos para cada data (exceto a primeira que já foi criada)
    for (let i = 1; i < recurrenceDates.length; i++) {
      const nextDate = recurrenceDates[i];

      try {
        await connection.execute(`
          INSERT INTO maintenance_schedules (
            equipment_id, description, scheduled_date, priority, 
            assigned_user_id, estimated_cost, created_by, maintenance_plan_id, parent_schedule_id,
            recurrence_type, recurrence_interval
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          equipmentId,
          description,
          nextDate.toISOString().slice(0, 19).replace('T', ' '),
          priority,
          assignedTo,
          estimatedValue || null,
          createdBy,
          maintenancePlanId,
          originalId,
          recurrenceType,
          recurrenceInterval
        ])

        createdCount++;
        console.log(`✅ [SCHEDULE] Agendamento recorrente ${i}/${recurrenceDates.length - 1} criado para data: ${formatDateBR(nextDate)}`);
        
      } catch (error) {
        console.error(`❌ [SCHEDULE] Erro ao criar agendamento recorrente ${i}:`, error);
        break;
      }
    }

    console.log(`✅ [SCHEDULE] Total de ${createdCount} agendamentos recorrentes criados (${recurrenceDates.length} total incluindo o principal)`);
    return createdCount;
  } catch (error) {
    console.error('❌ Erro ao criar agendamentos recorrentes:', error)
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}