import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { endpoint, p256dh_key, auth_key, user_agent } = body;

    if (!endpoint || !p256dh_key || !auth_key) {
      return NextResponse.json(
        { error: 'Dados de subscription inválidos' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    // Verificar se já existe uma subscription para este usuário e endpoint
    const existingSubscription = await query(
      'SELECT id FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
      [userId, endpoint]
    );

    if (existingSubscription.length > 0) {
      // Atualizar subscription existente
      await query(
        `UPDATE push_subscriptions 
         SET p256dh_key = ?, auth_key = ?, user_agent = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ? AND endpoint = ?`,
        [p256dh_key, auth_key, user_agent, userId, endpoint]
      );

      return NextResponse.json({
        success: true,
        message: 'Subscription atualizada com sucesso',
        subscriptionId: existingSubscription[0].id
      });
    } else {
      // Criar nova subscription
      const result = await query(
        `INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key, user_agent) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, endpoint, p256dh_key, auth_key, user_agent]
      );

      return NextResponse.json({
        success: true,
        message: 'Subscription criada com sucesso',
        subscriptionId: (result as any).insertId
      });
    }
  } catch (error) {
    console.error('Erro ao processar subscription:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint é obrigatório' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    // Remover subscription
    const result = await query(
      'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
      [userId, endpoint]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Subscription não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription removida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover subscription:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // Obter todas as subscriptions do usuário
    const subscriptions = await query(
      `SELECT id, endpoint, user_agent, created_at, updated_at 
       FROM push_subscriptions 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      subscriptions
    });
  } catch (error) {
    console.error('Erro ao obter subscriptions:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}