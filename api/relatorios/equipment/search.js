import { query } from '../../lib/database.js';
import express from 'express';
const router = express.Router();

// Buscar equipamentos para relatórios
const searchEquipments = async (req, res) => {
  console.log('🔍 [EQUIPMENT SEARCH] Iniciando busca de equipamentos para relatórios...');
  
  try {
    const { 
      sector_id, 
      start_date, 
      end_date, 
      search 
    } = req.query;

    console.log('📊 [EQUIPMENT SEARCH] Parâmetros recebidos:', {
      sector_id,
      start_date,
      end_date,
      search
    });

    let whereConditions = [];
    let queryParams = [];

    // Filtro por setor
    if (sector_id) {
      whereConditions.push('e.sector_id = ?');
      queryParams.push(sector_id);
    }

    // Filtro por busca (nome ou número de patrimônio)
    if (search) {
      whereConditions.push('(LOWER(e.name) LIKE ? OR LOWER(e.patrimonio_number) LIKE ? OR LOWER(e.patrimony) LIKE ? OR LOWER(e.code) LIKE ?)');
      const searchTerm = `%${search.toLowerCase()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Filtro por data (equipamentos com manutenções no período)
    if (start_date || end_date) {
      let dateCondition = '';
      if (start_date && end_date) {
        dateCondition = `EXISTS (
          SELECT 1 FROM service_orders so 
          WHERE so.equipment_id = e.id 
          AND so.completion_date BETWEEN ? AND ?
        )`;
        queryParams.push(start_date, end_date);
      } else if (start_date) {
        dateCondition = `EXISTS (
          SELECT 1 FROM service_orders so 
          WHERE so.equipment_id = e.id 
          AND so.completion_date >= ?
        )`;
        queryParams.push(start_date);
      } else if (end_date) {
        dateCondition = `EXISTS (
          SELECT 1 FROM service_orders so 
          WHERE so.equipment_id = e.id 
          AND so.completion_date <= ?
        )`;
        queryParams.push(end_date);
      }
      
      if (dateCondition) {
        whereConditions.push(dateCondition);
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const queryStr = `
      SELECT 
        e.id,
        e.name,
        e.patrimonio_number,
        e.patrimony,
        e.code,
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
        sub.name as subsector_name,
        COUNT(so.id) as maintenance_count,
        MAX(so.completion_date) as last_maintenance_date,
        SUM(COALESCE(so.actual_cost, so.cost, so.estimated_cost, 0)) as total_cost
      FROM equipment e
      LEFT JOIN sectors s ON e.sector_id = s.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN subsectors sub ON e.subsector_id = sub.id
      LEFT JOIN service_orders so ON e.id = so.equipment_id
      ${whereClause}
      GROUP BY e.id, e.name, e.patrimonio_number, e.patrimony, e.code, e.model, 
               e.serial_number, e.manufacturer, e.sector_id, e.category_id, 
               e.subsector_id, e.acquisition_date, e.last_maintenance, 
               e.next_maintenance, e.warranty_expiry, e.status, e.observations, 
               e.created_at, e.updated_at, e.location, e.is_active, e.voltage,
               s.name, c.name, sub.name
      ORDER BY e.name ASC
    `;

    console.log('🔍 [EQUIPMENT SEARCH] Executando query:', queryStr);
    console.log('📊 [EQUIPMENT SEARCH] Parâmetros:', queryParams);

    const rows = await query(queryStr, queryParams);
    console.log('📊 [EQUIPMENT SEARCH] Equipamentos encontrados:', rows.length);

    // Transformar os dados para o formato esperado pelo frontend
    const transformedData = rows.map(equipment => ({
      id: equipment.id,
      name: equipment.name,
      patrimonio_number: equipment.patrimonio_number || equipment.patrimony || equipment.code,
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
      sector_name: equipment.sector_name,
      category_name: equipment.category_name,
      subsector_name: equipment.subsector_name,
      maintenance_count: equipment.maintenance_count || 0,
      last_maintenance_date: equipment.last_maintenance_date,
      total_cost: equipment.total_cost || 0
    }));

    console.log('✅ [EQUIPMENT SEARCH] Busca concluída com sucesso');
    res.json(transformedData);

  } catch (error) {
    console.error('❌ [EQUIPMENT SEARCH] Erro ao buscar equipamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

// Rota GET para buscar equipamentos
router.get('/', searchEquipments);

export default router;