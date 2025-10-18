import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, deliveredAt } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId é obrigatório' },
        { status: 400 }
      );
    }

    // Atualizar status de entrega da notificação
    const result = await query(
      'UPDATE notifications SET read_status = "delivered" WHERE id = ? AND read_status = "sent"',
      [notificationId]
    );

    return NextResponse.json({
      success: true,
      message: 'Status de entrega atualizado',
      updated: (result as any).affectedRows > 0
    });
  } catch (error) {
    console.error('Erro ao marcar como entregue:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}