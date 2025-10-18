import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/database.js';

// GET - Listar equipamentos
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Route GET - Iniciando busca de equipamentos');
    
    const queryStr = `
      SELECT 
        e.id,
        e.name,
        e.patrimonio,
        e.model,
        e.serial_number,
        e.manufacturer,
        e.sector_id,
        e.category_id,
        e.subsector_id,
        e.installation_date,
        e.last_preventive_maintenance,
        e.next_preventive_maintenance,
        e.maintenance_frequency_days,
        e.warranty_expiry,
        e.status,
        e.observations,
        e.created_at,
        e.updated_at,
        e.patrimonio_number,
        e.voltage,
        e.power,
        e.maintenance_frequency,
        s.nome as sector_name,
        s.company_id,
        comp.name as company_name,
        c.name as category_name,
        sub.name as subsector_name
      FROM equipment e
      LEFT JOIN setores s ON e.sector_id = s.id
      LEFT JOIN companies comp ON s.company_id = comp.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN subsectors sub ON e.subsector_id = sub.id
      ORDER BY e.created_at DESC
    `;
    
    console.log('🔍 Executando query...');
    const rows = await query(queryStr, []);
    console.log('📊 Equipamentos encontrados:', rows.length);
    
    // Transformar os dados para o formato esperado pelo frontend
    const transformedData = rows.map(equipment => ({
      id: equipment.id,
      name: equipment.name,
      patrimonio: equipment.patrimonio,
      model: equipment.model,
      serial_number: equipment.serial_number,
      manufacturer: equipment.manufacturer,
      company_id: equipment.company_id,
      sector_id: equipment.sector_id,
      category_id: equipment.category_id,
      subsector_id: equipment.subsector_id,
      installation_date: equipment.installation_date,
      last_preventive_maintenance: equipment.last_preventive_maintenance,
      next_preventive_maintenance: equipment.next_preventive_maintenance,
      maintenance_frequency_days: equipment.maintenance_frequency_days,
      warranty_expiry: equipment.warranty_expiry,
      status: equipment.status,
      observations: equipment.observations,
      created_at: equipment.created_at,
      updated_at: equipment.updated_at,
      patrimonio_number: equipment.patrimonio_number,
      voltage: equipment.voltage,
      power: equipment.power,
      maintenance_frequency: equipment.maintenance_frequency,
      // Campos relacionados (joins)
      sector_name: equipment.sector_name,
      company_name: equipment.company_name,
      category_name: equipment.category_name,
      subsector_name: equipment.subsector_name,
    }));
    
    console.log('✅ Dados transformados com sucesso');
    
    const response = {
      success: true,
      data: transformedData
    };
    
    console.log('✅ Resposta preparada com sucesso');
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error('❌ Erro na API de equipamentos:', error);
    console.error('❌ Stack trace:', error.stack);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Criar equipamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const mockReq = {
      body,
      params: {},
      query: {}
    };

    let responseData: any = null;
    let statusCode = 200;

    const mockRes = {
      json: (data: any) => {
        responseData = data;
      },
      status: (code: number) => {
        statusCode = code;
        return {
          json: (data: any) => {
            responseData = data;
          }
        };
      }
    };

    await equipmentAPI.createEquipment(mockReq, mockRes);

    return NextResponse.json(responseData, { status: statusCode });
  } catch (error) {
    console.error('Erro ao criar equipamento:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}