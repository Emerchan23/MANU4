import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database.js';

// POST - Criar equipamento
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [EQUIPMENT NEW] POST - Iniciando...');
    
    const body = await request.json();
    console.log('📊 [EQUIPMENT NEW] Body:', body);
    
    // Validar dados obrigatórios
    const { name, model, serial_number, manufacturer, sector_id, company_id } = body;
    
    if (!name || !model || !serial_number || !manufacturer || !sector_id || !company_id) {
      return NextResponse.json({
        success: false,
        message: 'Dados obrigatórios não fornecidos'
      }, { status: 400 });
    }
    
    // Inserir no banco de dados
    const result = await query(`
      INSERT INTO equipment (
        name, model, serial_number, manufacturer, 
        sector_id, company_id, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'ativo', NOW())
    `, [name, model, serial_number, manufacturer, sector_id, company_id]);
    
    return NextResponse.json({
      success: true,
      message: 'Equipamento criado com sucesso',
      id: result.insertId,
      data: { id: result.insertId, ...body }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [EQUIPMENT NEW] Erro:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor', error: error.message },
      { status: 500 }
    );
  }
}

// GET - Listar equipamentos
export async function GET() {
  try {
    const equipments = await query(`
      SELECT 
        e.id, e.name, e.model, e.serial_number, e.manufacturer,
        e.status, e.created_at,
        s.name as sector_name,
        c.name as company_name
      FROM equipment e
      LEFT JOIN sectors s ON e.sector_id = s.id
      LEFT JOIN companies c ON e.company_id = c.id
      WHERE e.status = 'ativo'
      ORDER BY e.created_at DESC
    `);
    
    return NextResponse.json({
      success: true,
      data: equipments,
      message: 'Lista de equipamentos carregada com sucesso'
    });
  } catch (error) {
    console.error('❌ [EQUIPMENT NEW] Erro ao listar:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao carregar equipamentos', error: error.message },
      { status: 500 }
    );
  }
}