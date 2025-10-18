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
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');

    let query = `
      SELECT * FROM validation_rules 
      WHERE is_active = 1 
      ${entityType ? 'AND entity_type = ?' : ''}
      ORDER BY entity_type
    `;
    
    const params = entityType ? [entityType] : [];
    const [rows] = await connection.execute(query, params);

    return NextResponse.json({ rules: rows || [] });

  } catch (error) {
    console.error('Erro ao buscar regras de validação:', error);
    return NextResponse.json({ rules: [] });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export async function PUT(request: NextRequest) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const { entityType, rules, messages, isActive = true } = await request.json();

    if (!entityType || !rules) {
      return NextResponse.json(
        { error: 'entityType e rules são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se já existe uma regra para esta entidade
    const [existingRules] = await connection.execute(
      'SELECT * FROM validation_rules WHERE entity_type = ?',
      [entityType]
    );

    let result;
    if (existingRules.length > 0) {
      // Atualizar regra existente
      await connection.execute(
        `UPDATE validation_rules 
         SET rules = ?, custom_messages = ?, is_active = ?, updated_at = NOW()
         WHERE entity_type = ?`,
        [JSON.stringify(rules), JSON.stringify(messages || {}), isActive, entityType]
      );

      const [updatedRows] = await connection.execute(
        'SELECT * FROM validation_rules WHERE entity_type = ?',
        [entityType]
      );
      result = updatedRows[0];
    } else {
      // Criar nova regra
      await connection.execute(
        `INSERT INTO validation_rules (entity_type, rules, custom_messages, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [entityType, JSON.stringify(rules), JSON.stringify(messages || {}), isActive]
      );

      const [newRows] = await connection.execute(
        'SELECT * FROM validation_rules WHERE entity_type = ?',
        [entityType]
      );
      result = newRows[0];
    }

    // Log da atualização de regra
    await connection.execute(
      `INSERT INTO validation_logs (entity_type, entity_id, action_type, validation_result, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [
        entityType,
        0, // Regra geral, não específica de um registro
        'rule_update',
        JSON.stringify({
          rules,
          custom_messages: messages || {},
          is_active: isActive
        })
      ]
    );

    return NextResponse.json({
      success: true,
      updatedRules: result
    });

  } catch (error) {
    console.error('Erro ao atualizar regras de validação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
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
    connection = await mysql.createConnection(dbConfig);
    const { entityType, rules, messages, isActive = true } = await request.json();

    if (!entityType || !rules) {
      return NextResponse.json(
        { error: 'entityType e rules são obrigatórios' },
        { status: 400 }
      );
    }

    await connection.execute(
      `INSERT INTO validation_rules (entity_type, rules, custom_messages, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [entityType, JSON.stringify(rules), JSON.stringify(messages || {}), isActive]
    );

    const [newRows] = await connection.execute(
      'SELECT * FROM validation_rules WHERE entity_type = ? ORDER BY id DESC LIMIT 1',
      [entityType]
    );

    // Log da criação de regra
    await connection.execute(
      `INSERT INTO validation_logs (entity_type, entity_id, action_type, validation_result, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [
        entityType,
        0,
        'rule_create',
        JSON.stringify({
          rules,
          custom_messages: messages || {},
          is_active: isActive
        })
      ]
    );

    return NextResponse.json({
      success: true,
      rule: newRows[0]
    });

  } catch (error) {
    console.error('Erro ao criar regra de validação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export async function DELETE(request: NextRequest) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');

    if (!entityType) {
      return NextResponse.json(
        { error: 'entityType é obrigatório' },
        { status: 400 }
      );
    }

    // Desativar a regra ao invés de deletar
    await connection.execute(
      'UPDATE validation_rules SET is_active = 0, updated_at = NOW() WHERE entity_type = ?',
      [entityType]
    );

    // Log da desativação de regra
    await connection.execute(
      `INSERT INTO validation_logs (entity_type, entity_id, action_type, validation_result, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [entityType, 0, 'rule_delete', JSON.stringify({ deactivated: true })]
    );

    return NextResponse.json({
      success: true,
      message: 'Regra desativada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao desativar regra de validação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}