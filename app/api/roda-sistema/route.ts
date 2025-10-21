import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { formatDateTimeBR } from '@/lib/date-utils';

// Helper function to format wheel data with Brazilian dates
function formatWheelData(wheel: any) {
  return {
    ...wheel,
    created_at: formatDateTimeBR(wheel.created_at),
    updated_at: formatDateTimeBR(wheel.updated_at),
  };
}

// GET - Retrieve wheel states
export async function GET(request: NextRequest) {
  try {
    // Sistema de autenticação simplificado removido

    const { searchParams } = new URL(request.url);
    const wheelId = searchParams.get('id');

    if (wheelId) {
      // Get specific wheel
      const [wheels] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM wheel_states WHERE id = ?',
        [wheelId]
      );

      if (wheels.length === 0) {
        return NextResponse.json({ error: 'Roda não encontrada' }, { status: 404 });
      }

      return NextResponse.json(formatWheelData(wheels[0]));
    } else {
      // Get all wheels
      const [wheels] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM wheel_states ORDER BY name'
      );

      const formattedWheels = wheels.map(formatWheelData);
      return NextResponse.json(formattedWheels);
    }
  } catch (error) {
    console.error('Error fetching wheel states:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estados das rodas' },
      { status: 500 }
    );
  }
}

// POST - Create new wheel state
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, direction, speed, customSpeed, angle, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO wheel_states 
       (name, direction, speed, custom_speed, angle, is_active, created_by, updated_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        direction || 'stopped',
        speed || 'medium',
        customSpeed || 60,
        angle || 0,
        isActive || false,
        currentUser.id,
        currentUser.id,
      ]
    );

    // Log the action
    await pool.query(
      `INSERT INTO rotation_logs (wheel_id, action, user_id, details) 
       VALUES (?, 'create', ?, ?)`,
      [result.insertId, currentUser.id, `Roda criada: ${name}`]
    );

    const [newWheel] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM wheel_states WHERE id = ?',
      [result.insertId]
    );

    return NextResponse.json(formatWheelData(newWheel[0]), { status: 201 });
  } catch (error) {
    console.error('Error creating wheel state:', error);
    return NextResponse.json(
      { error: 'Erro ao criar estado da roda' },
      { status: 500 }
    );
  }
}

// PUT - Update wheel state
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, direction, speed, customSpeed, angle, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    // Check if wheel exists
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM wheel_states WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Roda não encontrada' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (direction !== undefined) {
      updates.push('direction = ?');
      values.push(direction);
    }
    if (speed !== undefined) {
      updates.push('speed = ?');
      values.push(speed);
    }
    if (customSpeed !== undefined) {
      updates.push('custom_speed = ?');
      values.push(customSpeed);
    }
    if (angle !== undefined) {
      updates.push('angle = ?');
      values.push(angle);
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(isActive);
    }

    updates.push('updated_by = ?');
    values.push(currentUser.id);
    values.push(id);

    await pool.query(
      `UPDATE wheel_states SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    // Determine action for logging
    let action = 'update';
    let details = 'Estado atualizado';
    
    if (isActive !== undefined) {
      action = isActive ? 'start' : 'stop';
      details = isActive ? 'Roda iniciada' : 'Roda parada';
    } else if (direction !== undefined && existing[0].direction !== direction) {
      action = 'direction_change';
      details = `Direção alterada para ${direction}`;
    } else if (speed !== undefined && existing[0].speed !== speed) {
      action = 'speed_change';
      details = `Velocidade alterada para ${speed}`;
    }

    // Log the action
    await pool.query(
      `INSERT INTO rotation_logs (wheel_id, action, user_id, details) 
       VALUES (?, ?, ?, ?)`,
      [id, action, currentUser.id, details]
    );

    const [updatedWheel] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM wheel_states WHERE id = ?',
      [id]
    );

    return NextResponse.json(formatWheelData(updatedWheel[0]));
  } catch (error) {
    console.error('Error updating wheel state:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar estado da roda' },
      { status: 500 }
    );
  }
}

// DELETE - Delete wheel state
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    // Check if wheel exists
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM wheel_states WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Roda não encontrada' }, { status: 404 });
    }

    // Delete logs first (foreign key constraint)
    await pool.query('DELETE FROM rotation_logs WHERE wheel_id = ?', [id]);

    // Delete wheel
    await pool.query('DELETE FROM wheel_states WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Roda excluída com sucesso' });
  } catch (error) {
    console.error('Error deleting wheel state:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir estado da roda' },
      { status: 500 }
    );
  }
}
