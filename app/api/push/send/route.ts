import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import webpush from 'web-push';

// Configurar VAPID keys (em produção, usar variáveis de ambiente)
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI2BN4EMYn5-Qsr7zzPKhBAkLwG6P99RIBY-Rj9RqNEaA0i0_1T5kSKHRU',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'tUkzMHalpnZnNyKFWqRUYbPVQrAh9yLc6FRj6sYM2P4'
};

webpush.setVapidDetails(
  'mailto:admin@hospital.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, notification, userIds } = body;

    if (!notification || (!userId && !userIds)) {
      return NextResponse.json({ 
        error: 'Missing required fields: notification and (userId or userIds)' 
      }, { status: 400 });
    }

    const targetUserIds = userIds || [userId];
    const results = [];

    for (const targetUserId of targetUserIds) {
      // Buscar todas as subscriptions do usuário
      const subscriptionsResult = await db.query(`
        SELECT * FROM push_subscriptions 
        WHERE user_id = $1 AND is_active = true
      `, [targetUserId]);

      const subscriptions = subscriptionsResult.rows;

      for (const subscription of subscriptions) {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          };

          const payload = JSON.stringify({
            title: notification.title,
            body: notification.message,
            icon: '/icon-192x192.svg',
            badge: '/badge-72x72.svg',
            tag: notification.type,
            data: {
              id: notification.id,
              type: notification.type,
              relatedId: notification.relatedId,
              relatedType: notification.relatedType,
              url: notification.url || '/notificacoes'
            }
          });

          await webpush.sendNotification(pushSubscription, payload);
          
          results.push({
            userId: targetUserId,
            subscriptionId: subscription.id,
            status: 'sent'
          });
        } catch (error) {
          console.error(`Error sending push notification to user ${targetUserId}:`, error);
          
          // Se a subscription é inválida, desativá-la
          if (error.statusCode === 410 || error.statusCode === 404) {
            await db.query(`
              UPDATE push_subscriptions 
              SET is_active = false 
              WHERE id = $1
            `, [subscription.id]);
          }
          
          results.push({
            userId: targetUserId,
            subscriptionId: subscription.id,
            status: 'failed',
            error: error.message
          });
        }
      }
    }

    return NextResponse.json({
      message: 'Push notifications processed',
      results
    });
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      vapidPublicKey: vapidKeys.publicKey
    });
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}