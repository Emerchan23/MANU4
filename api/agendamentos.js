import express from 'express';
import { query } from '../lib/database.js';

const router = express.Router();

// Função auxiliar para formatar datas
function formatDateBR(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateISO(date) {
  if (!date) return null;
  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

// GET - Listar agendamentos
router.get('/', async (req, res) => {
  try {
    console.log('🔍 [AGENDAMENTOS API] Iniciando busca de agendamentos');
    
    const { 
      page = 1, 
      limit = 10, 
      status, 
      equipment_id, 
      assigned_user_id,
      start_date,
      end_date,
      priority,
      search 
    } = req.query;

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
      whereConditions.push('ms.scheduled_date >= ?');
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push('ms.scheduled_date <= ?');
      queryParams.push(end_date);
    }

    if (priority) {
      whereConditions.push('ms.priority = ?');
      queryParams.push(priority);
    }

    if (search) {
      whereConditions.push('(e.name LIKE ? OR ms.description LIKE ? OR u.name LIKE ? OR e.code LIKE ? OR e.patrimonio_number LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Contar total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM maintenance_schedules ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN sectors s ON e.sector_id = s.id
      LEFT JOIN users u ON ms.assigned_user_id = u.id
      ${whereClause}
    `;
    
    const countResult = await query(countQuery, queryParams);
    const total = countResult[0]?.total || 0;

    // Buscar agendamentos
    const scheduleQuery = `
      SELECT 
        ms.*,
        e.name as equipment_name,
        e.model as equipment_model,
        e.serial_number as equipment_serial,
        e.code as equipment_code,
        e.patrimonio_number as equipment_patrimonio,
        s.name as sector_name,
        u.name as assigned_user_name,
        u.email as assigned_user_email,
        creator.name as created_by_name
      FROM maintenance_schedules ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN sectors s ON e.sector_id = s.id
      LEFT JOIN users u ON ms.assigned_user_id = u.id
      LEFT JOIN users creator ON ms.created_by = creator.id
      ${whereClause}
      ORDER BY ms.scheduled_date ASC, ms.priority DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), parseInt(offset));
    const schedules = await query(scheduleQuery, queryParams);

    console.log(`📊 [AGENDAMENTOS API] Encontrados ${schedules.length} agendamentos`);

    // Formatar datas e adicionar informações extras
    const formattedSchedules = schedules.map(item => ({
      ...item,
      scheduled_date: formatDateBR(item.scheduled_date),
      completion_date: item.completion_date ? formatDateBR(item.completion_date) : null,
      created_at: formatDateBR(item.created_at),
      updated_at: formatDateBR(item.updated_at),
      is_overdue: new Date(item.scheduled_date) < new Date() && item.status === 'pending'
    }));

    res.json({
      success: true,
      data: formattedSchedules,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ [AGENDAMENTOS API] Erro ao buscar agendamentos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar agendamentos'
    });
  }
});

// GET - Buscar agendamento por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 [AGENDAMENTOS API] Buscando agendamento ID: ${id}`);

    const scheduleQuery = `
      SELECT 
        ms.*,
        e.name as equipment_name,
        e.model as equipment_model,
        e.serial_number as equipment_serial,
        u.full_name as assigned_user_name,
        u.email as assigned_user_email,
        creator.full_name as created_by_name
      FROM maintenance_schedules ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN users u ON ms.assigned_user_id = u.id
      LEFT JOIN users creator ON ms.created_by = creator.id
      WHERE ms.id = ?
    `;

    const schedules = await query(scheduleQuery, [id]);

    if (schedules.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Agendamento não encontrado'
      });
    }

    const schedule = schedules[0];
    const formattedSchedule = {
      ...schedule,
      scheduled_date: formatDateBR(schedule.scheduled_date),
      completion_date: schedule.completion_date ? formatDateBR(schedule.completion_date) : null,
      created_at: formatDateBR(schedule.created_at),
      updated_at: formatDateBR(schedule.updated_at),
      is_overdue: new Date(schedule.scheduled_date) < new Date() && schedule.status === 'pending'
    };

    res.json({
      success: true,
      data: formattedSchedule
    });

  } catch (error) {
    console.error('❌ [AGENDAMENTOS API] Erro ao buscar agendamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar agendamento'
    });
  }
});

// POST - Criar novo agendamento
router.post('/', async (req, res) => {
  try {
    console.log('🔧 [AGENDAMENTOS API] Criando novo agendamento');
    console.log('📊 [AGENDAMENTOS API] Dados recebidos:', req.body);

    const {
      equipment_id,
      maintenance_type,
      description,
      scheduled_date,
      priority = 'medium',
      assigned_user_id,
      estimated_cost,
      created_by,
      maintenance_plan_id,
      recurrence_type = 'none',
      recurrence_interval = 1
    } = req.body;

    // Validações básicas
    if (!equipment_id || !maintenance_type || !scheduled_date || !created_by) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: equipment_id, maintenance_type, scheduled_date, created_by'
      });
    }

    // Verificar se o equipamento existe
    const equipmentExists = await query('SELECT id FROM equipment WHERE id = ?', [equipment_id]);
    if (equipmentExists.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Equipamento não encontrado'
      });
    }

    // Verificar se o usuário criador existe
    const creatorExists = await query('SELECT id FROM users WHERE id = ?', [created_by]);
    if (creatorExists.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Usuário criador não encontrado'
      });
    }

    // Verificar se o usuário atribuído existe (se fornecido)
    if (assigned_user_id) {
      const assignedUserExists = await query('SELECT id FROM users WHERE id = ?', [assigned_user_id]);
      if (assignedUserExists.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Usuário atribuído não encontrado'
        });
      }
    }

    // Inserir agendamento
    const insertQuery = `
      INSERT INTO maintenance_schedules (
        equipment_id, maintenance_type, description, scheduled_date, 
        priority, assigned_user_id, estimated_cost, created_by, maintenance_plan_id,
        recurrence_type, recurrence_interval
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(insertQuery, [
      equipment_id,
      maintenance_type,
      description,
      formatDateISO(scheduled_date),
      priority,
      assigned_user_id || null,
      estimated_cost || null,
      created_by,
      maintenance_plan_id || null,
      recurrence_type,
      recurrence_interval
    ]);

    console.log('✅ [AGENDAMENTOS API] Agendamento criado com ID:', result.insertId);

    // Criar agendamentos recorrentes se necessário
    if (recurrence_type && recurrence_type !== 'none') {
      console.log('🔄 [AGENDAMENTOS API] Criando agendamentos recorrentes...');
      await createRecurringSchedules(result.insertId, {
        equipment_id,
        maintenance_type,
        description,
        scheduled_date,
        priority,
        assigned_user_id,
        estimated_cost,
        created_by,
        maintenance_plan_id,
        recurrence_type,
        recurrence_interval
      });
    }

    // Buscar o agendamento criado com dados completos
    const createdSchedule = await query(`
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
    `, [result.insertId]);

    const schedule = createdSchedule[0];
    const formattedSchedule = {
      ...schedule,
      scheduled_date: formatDateBR(schedule.scheduled_date),
      completion_date: schedule.completion_date ? formatDateBR(schedule.completion_date) : null,
      created_at: formatDateBR(schedule.created_at),
      updated_at: formatDateBR(schedule.updated_at)
    };

    res.status(201).json({
      success: true,
      data: formattedSchedule,
      message: recurrence_type !== 'none' ? 
        'Agendamento criado com sucesso! Agendamentos recorrentes foram gerados automaticamente.' :
        'Agendamento criado com sucesso'
    });

  } catch (error) {
    console.error('❌ [AGENDAMENTOS API] Erro ao criar agendamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao criar agendamento'
    });
  }
});

// PUT - Atualizar agendamento
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔧 [AGENDAMENTOS API] Atualizando agendamento ID: ${id}`);
    console.log('📊 [AGENDAMENTOS API] Dados recebidos:', req.body);

    // Verificar se o agendamento existe
    const existingSchedule = await query('SELECT * FROM maintenance_schedules WHERE id = ?', [id]);
    if (existingSchedule.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Agendamento não encontrado'
      });
    }

    const {
      equipment_id,
      maintenance_type,
      description,
      scheduled_date,
      completion_date,
      status,
      priority,
      assigned_user_id,
      estimated_cost,
      actual_cost,
      completion_notes
    } = req.body;

    // Construir query de atualização dinamicamente
    let updateFields = [];
    let updateValues = [];

    if (equipment_id !== undefined) {
      // Verificar se o equipamento existe
      const equipmentExists = await query('SELECT id FROM equipment WHERE id = ?', [equipment_id]);
      if (equipmentExists.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Equipamento não encontrado'
        });
      }
      updateFields.push('equipment_id = ?');
      updateValues.push(equipment_id);
    }

    if (maintenance_type !== undefined) {
      updateFields.push('maintenance_type = ?');
      updateValues.push(maintenance_type);
    }

    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }

    if (scheduled_date !== undefined) {
      updateFields.push('scheduled_date = ?');
      updateValues.push(formatDateISO(scheduled_date));
    }

    if (completion_date !== undefined) {
      updateFields.push('completion_date = ?');
      updateValues.push(completion_date ? formatDateISO(completion_date) : null);
    }

    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (priority !== undefined) {
      updateFields.push('priority = ?');
      updateValues.push(priority);
    }

    if (assigned_user_id !== undefined) {
      if (assigned_user_id) {
        // Verificar se o usuário existe
        const userExists = await query('SELECT id FROM users WHERE id = ?', [assigned_user_id]);
        if (userExists.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Usuário atribuído não encontrado'
          });
        }
      }
      updateFields.push('assigned_user_id = ?');
      updateValues.push(assigned_user_id || null);
    }

    if (estimated_cost !== undefined) {
      updateFields.push('estimated_cost = ?');
      updateValues.push(estimated_cost);
    }

    if (actual_cost !== undefined) {
      updateFields.push('actual_cost = ?');
      updateValues.push(actual_cost);
    }

    if (completion_notes !== undefined) {
      updateFields.push('completion_notes = ?');
      updateValues.push(completion_notes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum campo para atualizar foi fornecido'
      });
    }

    // Adicionar updated_at
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const updateQuery = `
      UPDATE maintenance_schedules 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;

    await query(updateQuery, updateValues);

    console.log('✅ [AGENDAMENTOS API] Agendamento atualizado com sucesso');

    // Buscar o agendamento atualizado
    const updatedSchedule = await query(`
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
    `, [id]);

    const schedule = updatedSchedule[0];
    const formattedSchedule = {
      ...schedule,
      scheduled_date: formatDateBR(schedule.scheduled_date),
      completion_date: schedule.completion_date ? formatDateBR(schedule.completion_date) : null,
      created_at: formatDateBR(schedule.created_at),
      updated_at: formatDateBR(schedule.updated_at)
    };

    res.json({
      success: true,
      data: formattedSchedule,
      message: 'Agendamento atualizado com sucesso'
    });

  } catch (error) {
    console.error('❌ [AGENDAMENTOS API] Erro ao atualizar agendamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao atualizar agendamento'
    });
  }
});

// DELETE - Excluir agendamento
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ [AGENDAMENTOS API] Excluindo agendamento ID: ${id}`);

    // Verificar se o agendamento existe
    const existingSchedule = await query('SELECT * FROM maintenance_schedules WHERE id = ?', [id]);
    if (existingSchedule.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Agendamento não encontrado'
      });
    }

    // Verificar se o agendamento pode ser excluído (não está concluído)
    const schedule = existingSchedule[0];
    if (schedule.status === 'completed' || schedule.status === 'concluido') {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir agendamentos concluídos'
      });
    }

    // Excluir agendamento
    await query('DELETE FROM maintenance_schedules WHERE id = ?', [id]);

    console.log('✅ [AGENDAMENTOS API] Agendamento excluído com sucesso');

    res.json({
      success: true,
      message: 'Agendamento excluído com sucesso'
    });

  } catch (error) {
    console.error('❌ [AGENDAMENTOS API] Erro ao excluir agendamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao excluir agendamento'
    });
  }
});

// GET - Estatísticas de agendamentos
router.get('/stats/overview', async (req, res) => {
  try {
    console.log('📊 [AGENDAMENTOS API] Buscando estatísticas de agendamentos');

    const stats = {};

    // Total de agendamentos
    const totalResult = await query('SELECT COUNT(*) as total FROM maintenance_schedules');
    stats.total = totalResult[0]?.total || 0;

    // Agendamentos por status
    const statusResult = await query(`
      SELECT status, COUNT(*) as count 
      FROM maintenance_schedules 
      GROUP BY status
    `);
    stats.byStatus = statusResult.reduce((acc, item) => {
      acc[item.status] = item.count;
      return acc;
    }, {});

    // Agendamentos por prioridade
    const priorityResult = await query(`
      SELECT priority, COUNT(*) as count 
      FROM maintenance_schedules 
      GROUP BY priority
    `);
    stats.byPriority = priorityResult.reduce((acc, item) => {
      acc[item.priority] = item.count;
      return acc;
    }, {});

    // Agendamentos em atraso
    const overdueResult = await query(`
      SELECT COUNT(*) as count 
      FROM maintenance_schedules 
      WHERE scheduled_date < NOW() AND status IN ('pending', 'agendado')
    `);
    stats.overdue = overdueResult[0]?.count || 0;

    // Próximos agendamentos (próximos 7 dias)
    const upcomingResult = await query(`
      SELECT COUNT(*) as count 
      FROM maintenance_schedules 
      WHERE scheduled_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
      AND status IN ('pending', 'agendado')
    `);
    stats.upcoming = upcomingResult[0]?.count || 0;

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ [AGENDAMENTOS API] Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar estatísticas'
    });
  }
});

// Função auxiliar para criar agendamentos recorrentes
async function createRecurringSchedules(parentId, scheduleData) {
  const { 
    equipment_id, maintenance_type, description, scheduled_date, 
    priority, assigned_user_id, estimated_cost, recurrence_type, 
    recurrence_interval, created_by, maintenance_plan_id 
  } = scheduleData;

  console.log('🔄 Criando agendamentos recorrentes para:', { parentId, recurrence_type, recurrence_interval });

  // Criar até 12 próximos agendamentos (1 ano)
  let nextDate = new Date(scheduled_date);
  let createdCount = 0;
  
  for (let i = 0; i < 12; i++) {
    // Calcular próxima data baseada no tipo de recorrência
    switch (recurrence_type) {
      case 'daily':
        nextDate = new Date(nextDate);
        nextDate.setDate(nextDate.getDate() + recurrence_interval);
        break;
      case 'weekly':
        nextDate = new Date(nextDate);
        nextDate.setDate(nextDate.getDate() + (recurrence_interval * 7));
        break;
      case 'monthly':
        nextDate = new Date(nextDate);
        nextDate.setMonth(nextDate.getMonth() + recurrence_interval);
        break;
      case 'yearly':
        nextDate = new Date(nextDate);
        nextDate.setFullYear(nextDate.getFullYear() + recurrence_interval);
        break;
      default:
        console.log('❌ Tipo de recorrência inválido:', recurrence_type);
        return;
    }

    try {
      // Inserir próximo agendamento
      const insertQuery = `
        INSERT INTO maintenance_schedules (
          equipment_id, maintenance_type, description, scheduled_date, priority, 
          assigned_user_id, estimated_cost, created_by, maintenance_plan_id,
          recurrence_type, recurrence_interval, parent_schedule_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await query(insertQuery, [
        equipment_id,
        maintenance_type,
        description,
        formatDateISO(nextDate),
        priority,
        assigned_user_id || null,
        estimated_cost || null,
        created_by,
        maintenance_plan_id || null,
        recurrence_type,
        recurrence_interval,
        parentId
      ]);

      createdCount++;
      console.log(`✅ Agendamento recorrente ${i + 1} criado com ID: ${result.insertId} para data: ${formatDateBR(nextDate)}`);
      
    } catch (error) {
      console.error(`❌ Erro ao criar agendamento recorrente ${i + 1}:`, error);
      break; // Para de criar se houver erro
    }
  }

  console.log(`✅ Total de ${createdCount} agendamentos recorrentes criados`);
}

export default router;