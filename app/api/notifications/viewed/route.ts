import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, viewedAt } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId é obrigatório' },
        { status: 400 }
      );
    }

    // Atualizar status de visualização da notificação (se ainda não foi lida)
    const result = await query(
      'UPDATE notifications SET read_status = "viewed" WHERE id = ? AND read_status IN ("sent", "delivered") AND is_read = FALSE',
      [notificationId]
    );

    return NextResponse.json({
      success: true,
      message: 'Status de visualização atualizado',
      updated: (result as any).affectedRows > 0
    });
  } catch (error) {
    console.error('Erro ao marcar como vista:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}