import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { getServerSession } from 'next-auth';
import webpush from 'web-push';

// Configurar VAPID keys (em produção, usar variáveis de ambiente)
const VAPID_KEYS = {
  publicKey: 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLuxazjqAKVXTJtkTIbI-ckHSRRjXqC5u-IjJ7dXgyBuSGHlFnkOAg',
  privateKey: 'UzxN2lXyLsuPiLJXUC3p3TMxQrGGbvgGLn2lAp2wvN4'
};

webpush.setVapidDetails(
  'mailto:admin@hospital-maintenance.com',
  VAPID_KEYS.publicKey,
  VAPID_KEYS.privateKey
);

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

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
    const { 
      user_id, 
      title, 
      message, 
      type, 
      related_id, 
      related_type,
      send_push = true,
      send_to_all = false 
    } = body;

    if (!title || !message || !type) {
      return NextResponse.json(
        { error: 'Título, mensagem e tipo são obrigatórios' },
        { status: 400 }
      );
    }

    const validTypes = ['equipment_alert', 'maintenance_due', 'service_order_update', 'system_alert'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de notificação inválido' },
        { status: 400 }
      );
    }

    let targetUsers: number[] = [];

    if (send_to_all) {
      // Enviar para todos os usuários ativos
      const users = await query(
        'SELECT id FROM users WHERE active = 1'
      );
      targetUsers = users.map((user: any) => user.id);
    } else if (user_id) {
      // Enviar para usuário específico
      targetUsers = Array.isArray(user_id) ? user_id : [user_id];
    } else {
      return NextResponse.json(
        { error: 'user_id é obrigatório quando send_to_all é false' },
        { status: 400 }
      );
    }

    const results = {
      notifications_created: 0,
      push_sent: 0,
      push_failed: 0,
      errors: [] as string[]
    };

    // Processar cada usuário
    for (const userId of targetUsers) {
      try {
        // 1. Verificar se o usuário tem este tipo de notificação habilitado
        const settings = await query(
          `SELECT enabled, push_enabled FROM notification_settings 
           WHERE user_id = ? AND notification_type = ?`,
          [userId, type]
        );

        const userSettings = settings[0] || { enabled: true, push_enabled: true };
        
        if (!userSettings.enabled) {
          continue; // Usuário desabilitou este tipo de notificação
        }

        // 2. Criar notificação no banco de dados
        const notificationResult = await query(
          `INSERT INTO notifications (user_id, title, message, type, related_id, related_type, is_read) 
           VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
          [userId, title, message, type, related_id, related_type]
        );

        const notificationId = (notificationResult as any).insertId;
        results.notifications_created++;

        // 3. Enviar push notification se habilitado
        if (send_push && userSettings.push_enabled) {
          try {
            // Obter subscriptions do usuário
            const subscriptions = await query(
              `SELECT endpoint, p256dh_key, auth_key FROM push_subscriptions 
               WHERE user_id = ?`,
              [userId]
            );

            // Preparar payload da notificação
            const payload: NotificationPayload = {
              title,
              body: message,
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
              tag: `notification-${notificationId}`,
              data: {
                id: notificationId,
                type,
                related_id,
                related_type,
                url: getNotificationUrl(type, related_id),
                timestamp: Date.now()
              }
            };

            // Personalizar ações baseadas no tipo
            if (type === 'equipment_alert') {
              payload.actions = [
                { action: 'view-equipment', title: 'Ver Equipamento' },
                { action: 'dismiss', title: 'Dispensar' }
              ];
            } else if (type === 'maintenance_due') {
              payload.actions = [
                { action: 'view-maintenance', title: 'Ver Manutenção' },
                { action: 'schedule', title: 'Agendar' }
              ];
            } else if (type === 'service_order_update') {
              payload.actions = [
                { action: 'view-order', title: 'Ver Ordem' },
                { action: 'dismiss', title: 'Dispensar' }
              ];
            }

            // Enviar para cada subscription do usuário
            for (const subscription of subscriptions) {
              try {
                const pushSubscription = {
                  endpoint: subscription.endpoint,
                  keys: {
                    p256dh: subscription.p256dh_key,
                    auth: subscription.auth_key
                  }
                };

                await webpush.sendNotification(
                  pushSubscription,
                  JSON.stringify(payload),
                  {
                    TTL: 24 * 60 * 60, // 24 horas
                    urgency: type === 'system_alert' ? 'high' : 'normal'
                  }
                );

                results.push_sent++;
              } catch (pushError: any) {
                console.error('Erro ao enviar push para subscription:', pushError);
                results.push_failed++;
                
                // Se a subscription é inválida, remover do banco
                if (pushError.statusCode === 410 || pushError.statusCode === 404) {
                  await query(
                    'DELETE FROM push_subscriptions WHERE endpoint = ?',
                    [subscription.endpoint]
                  );
                }
              }
            }
          } catch (pushError) {
            console.error('Erro ao processar push notifications:', pushError);
            results.errors.push(`Erro push para usuário ${userId}: ${pushError}`);
          }
        }
      } catch (userError) {
        console.error(`Erro ao processar usuário ${userId}:`, userError);
        results.errors.push(`Erro usuário ${userId}: ${userError}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notificações processadas com sucesso',
      results
    });
  } catch (error) {
    console.error('Erro ao enviar notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função auxiliar para gerar URLs baseadas no tipo
function getNotificationUrl(type: string, relatedId?: number): string {
  switch (type) {
    case 'equipment_alert':
      return relatedId ? `/equipamentos/${relatedId}` : '/equipamentos';
    case 'maintenance_due':
      return relatedId ? `/manutencoes/${relatedId}` : '/manutencoes';
    case 'service_order_update':
      return relatedId ? `/ordens-servico/${relatedId}` : '/ordens-servico';
    case 'system_alert':
      return '/equipamentos';
    default:
      return '/notificacoes';
  }
}

// Endpoint para envio em lote (apenas para administradores)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se é administrador
    const userRole = await query(
      'SELECT role FROM users WHERE id = ?',
      [parseInt(session.user.id)]
    );

    if (!userRole[0] || userRole[0].role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado - apenas administradores' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { notifications } = body;

    if (!Array.isArray(notifications)) {
      return NextResponse.json(
        { error: 'Notifications deve ser um array' },
        { status: 400 }
      );
    }

    const batchResults = {
      total: notifications.length,
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Processar cada notificação
    for (let i = 0; i < notifications.length; i++) {
      try {
        const notification = notifications[i];
        
        // Fazer requisição interna para enviar cada notificação
        const response = await fetch(`${request.nextUrl.origin}/api/notifications/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('Cookie') || ''
          },
          body: JSON.stringify(notification)
        });

        if (response.ok) {
          batchResults.success++;
        } else {
          batchResults.failed++;
          const error = await response.text();
          batchResults.errors.push(`Notificação ${i + 1}: ${error}`);
        }
      } catch (error) {
        batchResults.failed++;
        batchResults.errors.push(`Notificação ${i + 1}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Lote de notificações processado',
      results: batchResults
    });
  } catch (error) {
    console.error('Erro ao processar lote de notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}