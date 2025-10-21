import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/database.js';

// POST - Criar equipamento (versão simplificada)
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [EQUIPMENT SIMPLE API] POST - Iniciando criação de equipamento...');
    
    // Ler o body da requisição de forma simples
    const body = await request.json();
    console.log('✅ [EQUIPMENT SIMPLE API] Body parseado:', body);
    
    // Validação básica
    if (!body.name) {
      console.log('❌ [EQUIPMENT SIMPLE API] Nome é obrigatório');
      return NextResponse.json(
        { success: false, message: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔍 [EQUIPMENT SIMPLE API] Preparando dados para inserção...');
    
    // Preparar dados para inserção
    const insertData = [
      body.name,
      body.patrimonio_number || null,
      body.patrimonio_number || null,
      body.model || null,
      body.serial_number || null,
      body.manufacturer || null,
      body.sector_id || null,
      body.category_id || null,
      body.subsector_id || null,
      body.location || null,
      body.installation_date || null,
      body.maintenance_frequency_days || null,
      body.warranty_expiry || null,
      body.status || 'ativo',
      body.observations || null,
      1 // is_active = true
    ];
    
    console.log('📊 [EQUIPMENT SIMPLE API] Dados preparados:', insertData);

    // Inserir equipamento na tabela
    const insertQuery = `
      INSERT INTO equipment (
        name, patrimony, code, model, serial_number, manufacturer, 
        sector_id, category_id, subsector_id, location, acquisition_date, 
        maintenance_frequency_days, warranty_expiry, status, observations, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    console.log('🔍 [EQUIPMENT SIMPLE API] Executando query de inserção...');
    const result = await query(insertQuery, insertData);
    
    console.log('✅ [EQUIPMENT SIMPLE API] Query executada com sucesso:', result);
    console.log('✅ [EQUIPMENT SIMPLE API] Equipamento criado com ID:', result.insertId);

    return NextResponse.json({
      success: true,
      message: 'Equipamento criado com sucesso',
      id: result.insertId
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [EQUIPMENT SIMPLE API] Erro ao criar equipamento:', error);
    console.error('❌ [EQUIPMENT SIMPLE API] Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro interno do servidor', 
        error: error.message
      },
      { status: 500 }
    );
  }
}