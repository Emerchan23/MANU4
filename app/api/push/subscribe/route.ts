import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subscription } = body;

    if (!userId || !subscription) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, subscription' 
      }, { status: 400 });
    }

    // Verificar se já existe uma subscription para este usuário e endpoint
    const existingResult = await db.query(`
      SELECT id FROM push_subscriptions 
      WHERE user_id = $1 AND endpoint = $2
    `, [userId, subscription.endpoint]);

    if (existingResult.rows.length > 0) {
      // Atualizar subscription existente
      const result = await db.query(`
        UPDATE push_subscriptions 
        SET 
          p256dh = $3,
          auth = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND endpoint = $2
        RETURNING *
      `, [
        userId, 
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth
      ]);

      return NextResponse.json(result.rows[0]);
    } else {
      // Criar nova subscription
      const result = await db.query(`
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [
        userId,
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth
      ]);

      return NextResponse.json(result.rows[0], { status: 201 });
    }
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const endpoint = searchParams.get('endpoint');

    if (!userId || !endpoint) {
      return NextResponse.json({ 
        error: 'Missing required parameters: userId, endpoint' 
      }, { status: 400 });
    }

    const result = await db.query(`
      DELETE FROM push_subscriptions 
      WHERE user_id = $1 AND endpoint = $2
      RETURNING *
    `, [userId, endpoint]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Error deleting push subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}