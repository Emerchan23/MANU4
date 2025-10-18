// Biblioteca para gerenciar notificações push no cliente
export class PushNotificationManager {
  private vapidPublicKey: string | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        // Registrar Service Worker
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');

        // Aguardar o Service Worker estar ativo
        await navigator.serviceWorker.ready;

        // Obter chave VAPID pública
        await this.getVapidPublicKey();
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    } else {
      console.warn('Push notifications are not supported in this browser');
    }
  }

  private async getVapidPublicKey(): Promise<void> {
    try {
      const response = await fetch('/api/push/send');
      const data = await response.json();
      this.vapidPublicKey = data.vapidPublicKey;
    } catch (error) {
      console.error('Error getting VAPID public key:', error);
    }
  }

  // Verificar se as notificações push são suportadas
  public isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // Verificar permissão atual
  public getPermission(): NotificationPermission {
    return Notification.permission;
  }

  // Solicitar permissão para notificações
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Verificar se o usuário está inscrito
  public async isSubscribed(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      this.subscription = await this.registration.pushManager.getSubscription();
      return this.subscription !== null;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  // Inscrever usuário para notificações push
  public async subscribe(userId: string): Promise<PushSubscription | null> {
    if (!this.registration || !this.vapidPublicKey) {
      throw new Error('Service Worker or VAPID key not available');
    }

    if (this.getPermission() !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission not granted for notifications');
      }
    }

    try {
      // Criar nova subscription
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      // Enviar subscription para o servidor
      await this.saveSubscription(userId, this.subscription);

      console.log('User subscribed to push notifications');
      return this.subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  // Cancelar inscrição
  public async unsubscribe(userId: string): Promise<void> {
    if (!this.subscription) {
      return;
    }

    try {
      // Cancelar subscription no navegador
      await this.subscription.unsubscribe();

      // Remover subscription do servidor
      await this.removeSubscription(userId, this.subscription.endpoint);

      this.subscription = null;
      console.log('User unsubscribed from push notifications');
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    }
  }

  // Salvar subscription no servidor
  private async saveSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        subscription: subscription.toJSON()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save subscription');
    }
  }

  // Remover subscription do servidor
  private async removeSubscription(userId: string, endpoint: string): Promise<void> {
    const response = await fetch(`/api/push/subscribe?userId=${userId}&endpoint=${encodeURIComponent(endpoint)}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to remove subscription');
    }
  }

  // Converter chave VAPID de base64 para Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
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

  // Testar notificação local
  public async testNotification(): Promise<void> {
    if (this.getPermission() !== 'granted') {
      throw new Error('Permission not granted for notifications');
    }

    const notification = new Notification('Teste de Notificação', {
      body: 'Esta é uma notificação de teste do sistema de manutenção.',
      icon: '/icon-192x192.svg',
      badge: '/badge-72x72.svg',
      tag: 'test'
    });

    // Auto-fechar após 5 segundos
    setTimeout(() => {
      notification.close();
    }, 5000);
  }

  // Obter status completo das notificações
  public async getStatus(): Promise<{
    supported: boolean;
    permission: NotificationPermission;
    subscribed: boolean;
    serviceWorkerReady: boolean;
  }> {
    return {
      supported: this.isSupported(),
      permission: this.getPermission(),
      subscribed: await this.isSubscribed(),
      serviceWorkerReady: this.registration !== null
    };
  }
}

// Instância singleton
export const pushNotificationManager = new PushNotificationManager();

// Hook React para usar notificações push
import { useState, useEffect } from 'react';

export function usePushNotifications(userId?: string) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await pushNotificationManager.getStatus();
      setIsSupported(status.supported);
      setPermission(status.permission);
      setIsSubscribed(status.subscribed);
    };

    checkStatus();
  }, []);

  const requestPermission = async () => {
    setIsLoading(true);
    try {
      const newPermission = await pushNotificationManager.requestPermission();
      setPermission(newPermission);
      return newPermission;
    } catch (error) {
      console.error('Error requesting permission:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async () => {
    if (!userId) {
      throw new Error('User ID is required for subscription');
    }

    setIsLoading(true);
    try {
      await pushNotificationManager.subscribe(userId);
      setIsSubscribed(true);
    } catch (error) {
      console.error('Error subscribing:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!userId) {
      throw new Error('User ID is required for unsubscription');
    }

    setIsLoading(true);
    try {
      await pushNotificationManager.unsubscribe(userId);
      setIsSubscribed(false);
    } catch (error) {
      console.error('Error unsubscribing:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = async () => {
    try {
      await pushNotificationManager.testNotification();
    } catch (error) {
      console.error('Error testing notification:', error);
      throw error;
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    testNotification
  };
}