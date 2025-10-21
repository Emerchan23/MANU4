import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
};

export async function GET(request: NextRequest) {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🔄 [ALERTS] Iniciando busca de todos os alertas...');
    
    // Get all alerts with equipment and sector information
    const [alertsRows] = await connection.execute(`
      SELECT 
        a.id,
        a.tipo as alert_type,
        a.prioridade as priority,
        a.descricao as description,
        a.data_vencimento as due_date,
        a.status,
        a.data_criacao as created_at,
        e.name as equipment_name,
        e.code as equipment_code,
        s.name as sector_name
      FROM alerts a
      LEFT JOIN equipment e ON a.equipment_id = e.id
      LEFT JOIN sectors s ON e.sector_id = s.id
      WHERE a.status = 'ATIVO'
      ORDER BY 
        CASE a.prioridade 
          WHEN 'ALTA' THEN 1 
          WHEN 'MEDIA' THEN 2 
          WHEN 'BAIXA' THEN 3 
        END,
        a.data_criacao DESC
    `);
    
    console.log('📊 [ALERTS] Total de alertas encontrados:', alertsRows.length);
    
    // Transform data to match the expected format for the alerts page
    const alerts = (alertsRows as any[]).map(alert => {
      return {
        id: alert.id,
        title: `${alert.alert_type} - ${alert.equipment_name || 'Equipamento'}`,
        description: alert.description,
        priority: alert.priority,
        equipment: alert.equipment_name || 'N/A',
        code: alert.equipment_code || 'N/A',
        created_at: alert.created_at,
        status: alert.status,
        sector: alert.sector_name || 'N/A'
      };
    });
    
    console.log('✅ [ALERTS] Alertas processados com sucesso');
    return NextResponse.json(alerts);
    
  } catch (error) {
    console.error('❌ [ALERTS] Erro na busca de alertas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export async function POST(request: NextRequest) {
  let connection;
  
  try {
    const body = await request.json();
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🔄 [ALERTS] Criando novo alerta...');
    
    const {
      tipo,
      prioridade,
      descricao,
      equipment_id,
      data_vencimento
    } = body;
    
    const [result] = await connection.execute(`
      INSERT INTO alerts (
        tipo, 
        prioridade, 
        descricao, 
        equipment_id, 
        data_vencimento, 
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, 'ATIVO', NOW())
    `, [tipo, prioridade, descricao, equipment_id, data_vencimento]);
    
    console.log('✅ [ALERTS] Alerta criado com sucesso');
    return NextResponse.json({ 
      success: true, 
      id: (result as any).insertId 
    });
    
  } catch (error) {
    console.error('❌ [ALERTS] Erro ao criar alerta:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}