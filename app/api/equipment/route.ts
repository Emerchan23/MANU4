import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/database.js';

// GET - Listar equipamentos
export async function GET() {
  try {
    console.log('🔍 [EQUIPMENT API] Iniciando busca de equipamentos...');
    
    const queryStr = `
      SELECT 
        e.id,
        e.name,
        e.patrimony,
        e.patrimonio_number,
        e.code,
        e.model,
        e.serial_number,
        e.manufacturer,
        e.sector_id,
        e.category_id,
        e.subsector_id,
        e.location,
        e.acquisition_date,
        e.last_maintenance,
        e.next_maintenance,
        e.warranty_expiry,
        e.status,
        e.observations,
        e.is_active,
        e.created_at,
        e.updated_at,
        e.voltage,
        s.name as sector_name,
        c.name as category_name,
        sub.name as subsector_name
      FROM equipment e
      LEFT JOIN sectors s ON e.sector_id = s.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN subsectors sub ON e.subsector_id = sub.id
      WHERE e.is_active = 1
      ORDER BY e.created_at DESC
    `;

    const equipments = await query(queryStr);
    
    console.log('✅ [EQUIPMENT API] Equipamentos encontrados:', equipments.length);
    
    return NextResponse.json({
      success: true,
      data: equipments,
      total: equipments.length
    });

  } catch (error) {
    console.error('❌ [EQUIPMENT API] Erro ao buscar equipamentos:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao buscar equipamentos',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// POST - Criar equipamento
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [EQUIPMENT API] POST - Iniciando criação de equipamento...');
    
    // Ler o body da requisição usando ReadableStream para evitar problemas
    let body;
    try {
      const reader = request.body?.getReader();
      if (reader) {
        const chunks = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            chunks.push(value);
          }
        }
        
        if (chunks.length > 0) {
          const bodyText = new TextDecoder().decode(
            new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []))
          );
          
          if (bodyText.trim()) {
            body = JSON.parse(bodyText);
            console.log('✅ [EQUIPMENT API] Body parseado via ReadableStream:', body);
          } else {
            throw new Error('Body vazio');
          }
        } else {
          throw new Error('Nenhum dado recebido');
        }
      } else {
        throw new Error('Request body não disponível');
      }
    } catch (parseError) {
      console.error('❌ [EQUIPMENT API] Erro ao parsear body:', parseError);
      return NextResponse.json(
        { success: false, message: 'Erro ao parsear dados da requisição', error: parseError.message },
        { status: 400 }
      );
    }
    
    // Validação básica
    if (!body.name) {
      console.log('❌ [EQUIPMENT API] Nome é obrigatório');
      return NextResponse.json(
        { success: false, message: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔍 [EQUIPMENT API] Preparando dados para inserção...');
    
    // Usar patrimonio_number se disponível, senão usar patrimony_number (compatibilidade)
    const patrimonioValue = body.patrimonio_number || body.patrimony_number;
    
    console.log('🔍 [EQUIPMENT API] Valores de patrimônio:');
    console.log('  - patrimonio_number:', body.patrimonio_number);
    console.log('  - patrimony_number:', body.patrimony_number);
    console.log('  - patrimonioValue final:', patrimonioValue);

    // Preparar dados para inserção
    const insertData = [
      body.name,
      patrimonioValue || null, // patrimony
      patrimonioValue || null, // patrimonio_number
      patrimonioValue || null, // code (usando mesmo valor)
      body.model || null,
      body.brand || body.manufacturer || null, // manufacturer
      body.serial_number || null,
      body.category_id || null,
      body.sector_id || null,
      body.subsector_id || null,
      body.location || null,
      body.status || 'ativo',
      body.installation_date || null, // acquisition_date
      body.warranty_expiry || null,
      body.last_maintenance || null,
      body.next_maintenance || null,
      body.observations || null,
      1, // is_active = true
      body.maintenance_frequency_days || null
    ];
    
    console.log('📊 [EQUIPMENT API] Dados preparados:', insertData);

    // Inserir equipamento na tabela
    const insertQuery = `
      INSERT INTO equipment (
        name, patrimony, patrimonio_number, code, model, manufacturer, 
        serial_number, category_id, sector_id, subsector_id, location, 
        status, acquisition_date, warranty_expiry, last_maintenance, 
        next_maintenance, observations, is_active, maintenance_frequency_days
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    console.log('🔍 [EQUIPMENT API] Executando query de inserção...');
    const result = await query(insertQuery, insertData);
    
    console.log('✅ [EQUIPMENT API] Query executada com sucesso:', result);
    console.log('✅ [EQUIPMENT API] Equipamento criado com ID:', result.insertId);

    return NextResponse.json({
      success: true,
      message: 'Equipamento criado com sucesso',
      id: result.insertId
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [EQUIPMENT API] Erro ao criar equipamento:', error);
    console.error('❌ [EQUIPMENT API] Stack trace:', error.stack);
    console.error('❌ [EQUIPMENT API] Tipo do erro:', typeof error);
    console.error('❌ [EQUIPMENT API] Propriedades do erro:', Object.keys(error));
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro interno do servidor', 
        error: error.message,
        errorType: typeof error,
        errorName: error.name
      },
      { status: 500 }
    );
  }
}