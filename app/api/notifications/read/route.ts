import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth_token');
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationId, notificationIds } = body;

    // Para simplificar, vamos usar um userId padrão ou extrair do token
    const userId = 1; // Ajustar conforme sua lógica de autenticação

    if (notificationIds && Array.isArray(notificationIds)) {
      // Marcar múltiplas notificações como lidas
      const placeholders = notificationIds.map(() => '?').join(',');
      const result = await query(
        `UPDATE notifications 
         SET is_read = TRUE, read_status = 'read' 
         WHERE id IN (${placeholders}) AND user_id = ?`,
        [...notificationIds, userId]
      );

      return NextResponse.json({
        success: true,
        message: `${(result as any).affectedRows} notificações marcadas como lidas`
      });
    } else if (notificationId) {
      // Marcar uma notificação como lida
      const result = await query(
        'UPDATE notifications SET is_read = TRUE, read_status = "read" WHERE id = ? AND user_id = ?',
        [notificationId, userId]
      );

      if ((result as any).affectedRows === 0) {
        return NextResponse.json(
          { error: 'Notificação não encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Notificação marcada como lida'
      });
    } else {
      return NextResponse.json(
        { error: 'notificationId ou notificationIds é obrigatório' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Erro ao marcar como lida:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Marcar todas as notificações como lidas
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // Marcar todas as notificações não lidas como lidas
    const result = await query(
      'UPDATE notifications SET is_read = TRUE, read_status = "read" WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: `${(result as any).affectedRows} notificações marcadas como lidas`
    });
  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}