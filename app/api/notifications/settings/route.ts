import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const result = await db.query(`
      SELECT * FROM notification_settings 
      WHERE user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      // Criar configurações padrão se não existirem
      const defaultSettings = await db.query(`
        INSERT INTO notification_settings (
          user_id, 
          equipment_status_push, equipment_status_email, equipment_status_sound,
          service_order_push, service_order_email, service_order_sound,
          maintenance_push, maintenance_email, maintenance_sound,
          system_push, system_email, system_sound,
          all_notifications
        ) VALUES ($1, true, true, true, true, true, true, true, true, true, true, true, true)
        RETURNING *
      `, [userId]);

      return NextResponse.json(defaultSettings.rows[0]);
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, settings } = body;

    if (!userId || !settings) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, settings' 
      }, { status: 400 });
    }

    const {
      equipment_status_push, equipment_status_email, equipment_status_sound,
      service_order_push, service_order_email, service_order_sound,
      maintenance_push, maintenance_email, maintenance_sound,
      system_push, system_email, system_sound,
      all_notifications
    } = settings;

    const result = await db.query(`
      UPDATE notification_settings 
      SET 
        equipment_status_push = $2,
        equipment_status_email = $3,
        equipment_status_sound = $4,
        service_order_push = $5,
        service_order_email = $6,
        service_order_sound = $7,
        maintenance_push = $8,
        maintenance_email = $9,
        maintenance_sound = $10,
        system_push = $11,
        system_email = $12,
        system_sound = $13,
        all_notifications = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `, [
      userId,
      equipment_status_push, equipment_status_email, equipment_status_sound,
      service_order_push, service_order_email, service_order_sound,
      maintenance_push, maintenance_email, maintenance_sound,
      system_push, system_email, system_sound,
      all_notifications
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}