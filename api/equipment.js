import { query } from '../lib/database.js';
import express from 'express';
const router = express.Router();

// Listar todos os equipamentos
const getEquipments = async (req, res) => {
  console.log('🔍 [EQUIPMENT API] Iniciando busca de equipamentos...');
  try {
    const queryStr = `
      SELECT 
        e.id,
        e.name,
        e.model,
        e.serial_number,
        e.manufacturer,
        e.sector_id,
        e.category_id,
        e.subsector_id,
        e.acquisition_date,
        e.last_maintenance,
        e.next_maintenance,
        e.warranty_expiry,
        e.status,
        e.observations,
        e.created_at,
        e.updated_at,
        e.location,
        e.is_active,
        e.voltage,
        s.name as sector_name,
        c.name as category_name,
        sub.name as subsector_name
      FROM equipment e
      LEFT JOIN sectors s ON e.sector_id = s.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN subsectors sub ON e.subsector_id = sub.id
      ORDER BY e.created_at DESC
    `;
    
    console.log('🔍 [EQUIPMENT API] Executando query...');
    const rows = await query(queryStr, []);
    console.log('📊 [EQUIPMENT API] Equipamentos encontrados:', rows.length);
    
    // Transformar os dados para o formato esperado pelo frontend
    const transformedData = rows.map(equipment => ({
      id: equipment.id,
      name: equipment.name,
      model: equipment.model,
      serial_number: equipment.serial_number,
      manufacturer: equipment.manufacturer,
      sector_id: equipment.sector_id,
      category_id: equipment.category_id,
      subsector_id: equipment.subsector_id,
      acquisition_date: equipment.acquisition_date,
      last_maintenance: equipment.last_maintenance,
      next_maintenance: equipment.next_maintenance,
      warranty_expiry: equipment.warranty_expiry,
      status: equipment.status,
      observations: equipment.observations,
      created_at: equipment.created_at,
      updated_at: equipment.updated_at,
      location: equipment.location,
      is_active: equipment.is_active,
      voltage: equipment.voltage,
      // Campos relacionados (joins)
      sector_name: equipment.sector_name,
      category_name: equipment.category_name,
      subsector_name: equipment.subsector_name,
    }));
    
    res.json({
      success: true,
      data: transformedData
    });
    console.log('✅ [EQUIPMENT API] Resposta enviada com sucesso');
  } catch (error) {
    console.error('❌ [EQUIPMENT API] Erro ao buscar equipamentos:', error);
    console.error('❌ [EQUIPMENT API] Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Buscar equipamento por ID
const getEquipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const queryStr = `
      SELECT 
        e.*,
        s.name as sector_name,
        c.name as category_name,
        sub.name as subsector_name
      FROM equipment e
      LEFT JOIN sectors s ON e.sector_id = s.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN subsectors sub ON e.subsector_id = sub.id
      WHERE e.id = ?
    `;
    
    const rows = await query(queryStr, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipamento não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar equipamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Criar novo equipamento
const createEquipment = async (req, res) => {
  try {
    console.log('🔄 [EQUIPMENT API] Criando novo equipamento...');
    console.log('📊 [EQUIPMENT API] Dados recebidos:', req.body);
    
    const {
      name,
      patrimonio,
      model,
      serial_number,
      manufacturer,
      sector_id,
      category_id,
      subsector_id,
      installation_date,
      maintenance_frequency_days,
      warranty_expiry,
      status,
      observations,
      voltage,
      power,
      maintenance_frequency
    } = req.body;

    // Validações básicas
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nome é obrigatório'
      });
    }

    const queryStr = `
      INSERT INTO equipment (
        name, patrimony, code, model, serial_number, manufacturer, sector_id, category_id,
        subsector_id, acquisition_date, maintenance_frequency_days, warranty_expiry, status, observations, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(queryStr, [
      name,
      patrimonio || null, // patrimony
      patrimonio || null, // code (using same value as patrimony)
      model || null,
      serial_number || null,
      manufacturer || null,
      sector_id || null,
      category_id || null,
      subsector_id || null,
      installation_date || null, // acquisition_date
      maintenance_frequency_days || null,
      warranty_expiry || null,
      status || 'ativo',
      observations || null,
      1 // is_active = true
    ]);

    console.log('✅ [EQUIPMENT API] Equipamento criado com ID:', result.insertId);

    // Buscar o equipamento criado
    const newEquipment = await query(
      'SELECT * FROM equipment WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: newEquipment[0],
      id: result.insertId,
      message: 'Equipamento criado com sucesso'
    });
  } catch (error) {
    console.error('❌ [EQUIPMENT API] Erro ao criar equipamento:', error);
    console.error('❌ [EQUIPMENT API] Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

// Atualizar equipamento
const updateEquipment = async (req, res) => {
  try {
    console.log('🔄 [UPDATE EQUIPMENT] Iniciando atualização...');
    console.log('📊 [UPDATE EQUIPMENT] Params:', req.params);
    console.log('📊 [UPDATE EQUIPMENT] Body recebido:', req.body);
    
    const { id } = req.params;
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
      voltage,
      status
    } = req.body;

    // Validações básicas
    if (!name || !sector_id) {
      console.log('❌ [UPDATE EQUIPMENT] Validação falhou - nome ou setor ausente');
      return res.status(400).json({
        success: false,
        message: 'Nome e setor são obrigatórios'
      });
    }

    // Verificar se o equipamento existe
    console.log('🔍 [UPDATE EQUIPMENT] Verificando se equipamento existe...');
    const existing = await query('SELECT id FROM equipment WHERE id = ?', [id]);
    if (existing.length === 0) {
      console.log('❌ [UPDATE EQUIPMENT] Equipamento não encontrado');
      return res.status(404).json({
        success: false,
        message: 'Equipamento não encontrado'
      });
    }

    console.log('✅ [UPDATE EQUIPMENT] Equipamento encontrado, executando update...');
    
    const queryStr = `
      UPDATE equipment SET
        name = ?, model = ?, serial_number = ?, manufacturer = ?,
        sector_id = ?, category_id = ?, subsector_id = ?,
        acquisition_date = ?, maintenance_frequency_days = ?, observations = ?, 
        patrimony = ?, status = ?, updated_at = NOW()
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
      installation_date || null, // acquisition_date
      maintenance_frequency_days || null,
      observations || null,
      patrimonio_number || null,
      status || 'ativo',
      id
    ];
    
    console.log('📊 [UPDATE EQUIPMENT] Parâmetros do update:', updateParams);

    await query(queryStr, updateParams);
    
    console.log('✅ [UPDATE EQUIPMENT] Update executado com sucesso');

    // Buscar o equipamento atualizado
    const updatedEquipment = await query(
      'SELECT * FROM equipment WHERE id = ?',
      [id]
    );

    console.log('📊 [UPDATE EQUIPMENT] Equipamento atualizado:', updatedEquipment[0]);

    res.json({
      success: true,
      data: updatedEquipment[0],
      message: 'Equipamento atualizado com sucesso'
    });
  } catch (error) {
    console.error('❌ [UPDATE EQUIPMENT] Erro ao atualizar equipamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Deletar equipamento
const deleteEquipment = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o equipamento existe
    const existing = await query('SELECT id FROM equipment WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipamento não encontrado'
      });
    }

    await query('DELETE FROM equipment WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Equipamento deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar equipamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Buscar histórico de manutenção do equipamento
const getEquipmentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10, offset = 0, type, status, startDate, endDate } = req.query;

    console.log(`🔍 [EQUIPMENT HISTORY] Buscando histórico do equipamento ${id}...`);

    // Verificar se o equipamento existe
    const equipmentExists = await query('SELECT id FROM equipment WHERE id = ?', [id]);
    if (equipmentExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipamento não encontrado'
      });
    }

    // Construir query com filtros
    let whereConditions = ['ms.equipment_id = ?'];
    let queryParams = [id];

    if (type) {
      whereConditions.push('mt.category = ?');
      queryParams.push(type);
    }

    if (status) {
      whereConditions.push('ms.status = ?');
      queryParams.push(status);
    }

    if (startDate) {
      whereConditions.push('ms.scheduled_date >= ?');
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push('ms.scheduled_date <= ?');
      queryParams.push(endDate);
    }

    const historyQuery = `
      SELECT 
        ms.id,
        ms.scheduled_date,
        ms.completed_at,
        ms.status,
        ms.priority,
        ms.estimated_cost,
        ms.actual_cost,
        ms.actual_duration_hours,
        ms.completion_notes,
        ms.issues_found,
        ms.recommendations,
        mt.name as maintenance_type,
        mt.category as maintenance_category,
        c.name as company_name,
        u.full_name as technician_name,
        u2.name as completed_by_name
      FROM maintenance_schedules ms
      LEFT JOIN maintenance_types mt ON ms.maintenance_type_id = mt.id
      LEFT JOIN companies c ON ms.company_id = c.id
      LEFT JOIN users u ON ms.technician_id = u.id
      LEFT JOIN users u2 ON ms.completed_by = u2.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ms.scheduled_date DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), parseInt(offset));

    const history = await query(historyQuery, queryParams);

    // Contar total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM maintenance_schedules ms
      LEFT JOIN maintenance_types mt ON ms.maintenance_type_id = mt.id
      WHERE ${whereConditions.join(' AND ')}
    `;

    const countParams = queryParams.slice(0, -2); // Remove limit e offset
    const [countResult] = await query(countQuery, countParams);

    console.log(`📊 [EQUIPMENT HISTORY] Encontrados ${history.length} registros de ${countResult.total} total`);

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          total: countResult.total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < countResult.total
        }
      }
    });

  } catch (error) {
    console.error('❌ [EQUIPMENT HISTORY] Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Buscar estatísticas do equipamento
const getEquipmentStats = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📊 [EQUIPMENT STATS] Calculando estatísticas do equipamento ${id}...`);

    // Verificar se o equipamento existe
    const equipmentExists = await query('SELECT id, name FROM equipment WHERE id = ?', [id]);
    if (equipmentExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipamento não encontrado'
      });
    }

    // Buscar ou criar estatísticas na tabela equipment_maintenance_stats
    let [stats] = await query('SELECT * FROM equipment_maintenance_stats WHERE equipment_id = ?', [id]);

    if (!stats) {
      // Calcular estatísticas em tempo real se não existir na tabela
      const statsQuery = `
        SELECT 
          COUNT(*) as total_maintenances,
          COUNT(CASE WHEN mt.category = 'preventiva' THEN 1 END) as preventive_count,
          COUNT(CASE WHEN mt.category = 'corretiva' THEN 1 END) as corrective_count,
          COUNT(CASE WHEN mt.category = 'calibracao' THEN 1 END) as predictive_count,
          COALESCE(SUM(ms.actual_cost), 0) as total_cost,
          COALESCE(AVG(ms.actual_cost), 0) as average_cost,
          MAX(ms.completed_at) as last_maintenance_date,
          COALESCE(AVG(DATEDIFF(ms.completed_at, ms.scheduled_date)), 0) as avg_delay_days,
          COUNT(CASE WHEN ms.status = 'concluida' THEN 1 END) * 100.0 / COUNT(*) as success_rate,
          COALESCE(SUM(ms.actual_duration_hours), 0) as total_downtime_hours
        FROM maintenance_schedules ms
        LEFT JOIN maintenance_types mt ON ms.maintenance_type_id = mt.id
        WHERE ms.equipment_id = ? AND ms.status IN ('concluida', 'cancelada')
      `;

      const [calculatedStats] = await query(statsQuery, [id]);

      // Calcular próxima manutenção baseada na frequência do equipamento
      const [equipmentInfo] = await query(
        'SELECT maintenance_frequency_days, last_preventive_maintenance FROM equipment WHERE id = ?', 
        [id]
      );

      let nextMaintenanceDate = null;
      if (equipmentInfo && equipmentInfo.maintenance_frequency_days && calculatedStats.last_maintenance_date) {
        const lastDate = new Date(calculatedStats.last_maintenance_date);
        nextMaintenanceDate = new Date(lastDate.getTime() + (equipmentInfo.maintenance_frequency_days * 24 * 60 * 60 * 1000));
      }

      // Calcular intervalo médio entre manutenções
      const intervalQuery = `
        SELECT AVG(days_between) as average_interval_days
        FROM (
          SELECT DATEDIFF(
            ms.completed_at,
            LAG(ms.completed_at) OVER (ORDER BY ms.completed_at)
          ) as days_between
          FROM maintenance_schedules ms
          WHERE ms.equipment_id = ? AND ms.status = 'concluida' AND ms.completed_at IS NOT NULL
        ) intervals
        WHERE days_between IS NOT NULL
      `;

      const [intervalResult] = await query(intervalQuery, [id]);

      stats = {
        equipment_id: parseInt(id),
        total_maintenances: calculatedStats.total_maintenances || 0,
        preventive_count: calculatedStats.preventive_count || 0,
        corrective_count: calculatedStats.corrective_count || 0,
        predictive_count: calculatedStats.predictive_count || 0,
        total_cost: parseFloat(calculatedStats.total_cost) || 0,
        average_cost: parseFloat(calculatedStats.average_cost) || 0,
        last_maintenance_date: calculatedStats.last_maintenance_date,
        next_maintenance_date: nextMaintenanceDate,
        average_interval_days: Math.round(intervalResult?.average_interval_days) || null,
        success_rate: parseFloat(calculatedStats.success_rate) || 100,
        downtime_hours: parseFloat(calculatedStats.total_downtime_hours) || 0,
        mtbf_hours: null, // Será calculado posteriormente
        mttr_hours: calculatedStats.total_maintenances > 0 ? 
          (parseFloat(calculatedStats.total_downtime_hours) / calculatedStats.total_maintenances) : null
      };

      // Inserir/atualizar na tabela de estatísticas
      await query(`
        INSERT INTO equipment_maintenance_stats (
          equipment_id, total_maintenances, preventive_count, corrective_count, predictive_count,
          total_cost, average_cost, last_maintenance_date, next_maintenance_date,
          average_interval_days, success_rate, downtime_hours, mttr_hours
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          total_maintenances = VALUES(total_maintenances),
          preventive_count = VALUES(preventive_count),
          corrective_count = VALUES(corrective_count),
          predictive_count = VALUES(predictive_count),
          total_cost = VALUES(total_cost),
          average_cost = VALUES(average_cost),
          last_maintenance_date = VALUES(last_maintenance_date),
          next_maintenance_date = VALUES(next_maintenance_date),
          average_interval_days = VALUES(average_interval_days),
          success_rate = VALUES(success_rate),
          downtime_hours = VALUES(downtime_hours),
          mttr_hours = VALUES(mttr_hours),
          updated_at = CURRENT_TIMESTAMP
      `, [
        stats.equipment_id, stats.total_maintenances, stats.preventive_count,
        stats.corrective_count, stats.predictive_count, stats.total_cost,
        stats.average_cost, stats.last_maintenance_date, stats.next_maintenance_date,
        stats.average_interval_days, stats.success_rate, stats.downtime_hours, stats.mttr_hours
      ]);
    }

    // Buscar últimas 5 manutenções para timeline
    const recentMaintenances = await query(`
      SELECT 
        ms.id,
        ms.scheduled_date,
        ms.completed_at,
        ms.status,
        ms.actual_cost,
        mt.name as maintenance_type,
        mt.category as maintenance_category
      FROM maintenance_schedules ms
      LEFT JOIN maintenance_types mt ON ms.maintenance_type_id = mt.id
      WHERE ms.equipment_id = ?
      ORDER BY ms.scheduled_date DESC
      LIMIT 5
    `, [id]);

    console.log(`✅ [EQUIPMENT STATS] Estatísticas calculadas para equipamento ${equipmentExists[0].name}`);

    res.json({
      success: true,
      data: {
        equipment: {
          id: equipmentExists[0].id,
          name: equipmentExists[0].name
        },
        stats,
        recentMaintenances
      }
    });

  } catch (error) {
    console.error('❌ [EQUIPMENT STATS] Erro ao calcular estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Configurar rotas
router.get('/', getEquipments);
router.get('/:id', getEquipmentById);
router.get('/:id/history', getEquipmentHistory);
router.get('/:id/stats', getEquipmentStats);
router.post('/', createEquipment);
router.put('/:id', updateEquipment);
router.delete('/:id', deleteEquipment);

export {
  getEquipments,
  getEquipmentById,
  getEquipmentHistory,
  getEquipmentStats,
  createEquipment,
  updateEquipment,
  deleteEquipment
};

export default router;