// Biblioteca para gerenciar notificações push no cliente
class PushNotificationManager {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NqIUHI80NqIUHI80NqIUHI80NqIUHI80NqIUHI80NqIUHI80NqIUHI80NqI';
  }

  // Verificar se notificações push são suportadas
  isSupported() {
    return this.isSupported;
  }

  // Registrar Service Worker
  async registerServiceWorker() {
    if (!this.isSupported) {
      throw new Error('Push notifications não são suportadas neste navegador');
    }

    try {
      console.log('Registrando Service Worker...');
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registrado:', this.registration);

      // Aguardar o service worker estar pronto
      await navigator.serviceWorker.ready;
      
      return this.registration;
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
      throw error;
    }
  }

  // Solicitar permissão para notificações
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Push notifications não são suportadas');
    }

    const permission = await Notification.requestPermission();
    console.log('Permissão de notificação:', permission);
    
    if (permission !== 'granted') {
      throw new Error('Permissão de notificação negada');
    }

    return permission;
  }

  // Converter VAPID key para Uint8Array
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Criar subscription push
  async createSubscription() {
    if (!this.registration) {
      await this.registerServiceWorker();
    }

    try {
      console.log('Criando subscription push...');
      
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      console.log('Subscription criada:', this.subscription);
      return this.subscription;
    } catch (error) {
      console.error('Erro ao criar subscription:', error);
      throw error;
    }
  }

  // Obter subscription existente
  async getSubscription() {
    if (!this.registration) {
      await this.registerServiceWorker();
    }

    try {
      this.subscription = await this.registration.pushManager.getSubscription();
      return this.subscription;
    } catch (error) {
      console.error('Erro ao obter subscription:', error);
      throw error;
    }
  }

  // Enviar subscription para o servidor
  async sendSubscriptionToServer(userId) {
    if (!this.subscription) {
      throw new Error('Nenhuma subscription disponível');
    }

    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          subscription: this.subscription.toJSON()
        })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('Subscription enviada para servidor:', result);
      return result;
    } catch (error) {
      console.error('Erro ao enviar subscription:', error);
      throw error;
    }
  }

  // Cancelar subscription
  async unsubscribe() {
    if (!this.subscription) {
      console.log('Nenhuma subscription para cancelar');
      return true;
    }

    try {
      const result = await this.subscription.unsubscribe();
      console.log('Subscription cancelada:', result);
      this.subscription = null;
      return result;
    } catch (error) {
      console.error('Erro ao cancelar subscription:', error);
      throw error;
    }
  }

  // Inicializar notificações push para um usuário
  async initialize(userId) {
    try {
      console.log('Inicializando notificações push para usuário:', userId);

      // 1. Verificar suporte
      if (!this.isSupported) {
        throw new Error('Push notifications não suportadas');
      }

      // 2. Registrar Service Worker
      await this.registerServiceWorker();

      // 3. Solicitar permissão
      await this.requestPermission();

      // 4. Verificar se já existe subscription
      let subscription = await this.getSubscription();
      
      if (!subscription) {
        // 5. Criar nova subscription
        subscription = await this.createSubscription();
      }

      // 6. Enviar para servidor
      await this.sendSubscriptionToServer(userId);

      console.log('Notificações push inicializadas com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao inicializar notificações push:', error);
      throw error;
    }
  }

  // Testar notificação local
  async testLocalNotification() {
    if (!this.isSupported) {
      throw new Error('Notificações não suportadas');
    }

    if (Notification.permission !== 'granted') {
      throw new Error('Permissão de notificação não concedida');
    }

    const notification = new Notification('Teste de Notificação', {
      body: 'Esta é uma notificação de teste do sistema de manutenção',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'test-notification',
      requireInteraction: false,
      actions: [
        {
          action: 'view',
          title: 'Ver'
        },
        {
          action: 'dismiss',
          title: 'Dispensar'
        }
      ]
    });

    notification.onclick = () => {
      console.log('Notificação de teste clicada');
      notification.close();
      window.focus();
    };

    return notification;
  }

  // Obter status das notificações
  getStatus() {
    return {
      isSupported: this.isSupported,
      permission: Notification.permission,
      hasRegistration: !!this.registration,
      hasSubscription: !!this.subscription,
      serviceWorkerState: this.registration?.active?.state || 'unknown'
    };
  }

  // Atualizar Service Worker
  async updateServiceWorker() {
    if (!this.registration) {
      throw new Error('Service Worker não registrado');
    }

    try {
      await this.registration.update();
      console.log('Service Worker atualizado');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar Service Worker:', error);
      throw error;
    }
  }
}

// Instância singleton
const pushManager = new PushNotificationManager();

export default pushManager;

// Funções de conveniência
export const initializePushNotifications = (userId) => pushManager.initialize(userId);
export const testNotification = () => pushManager.testLocalNotification();
export const getNotificationStatus = () => pushManager.getStatus();
export const unsubscribeFromPush = () => pushManager.unsubscribe();