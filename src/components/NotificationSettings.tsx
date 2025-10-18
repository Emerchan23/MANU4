"use client"
// Componente de configurações de notificações
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Bell, 
  BellOff, 
  Smartphone, 
  Monitor, 
  Volume2, 
  VolumeX,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface NotificationSetting {
  id: number;
  user_id: number;
  notification_type: string;
  push_enabled: boolean;
  email_enabled: boolean;
  sound_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface NotificationSettingsProps {
  userId: number;
  token: string;
}

export function NotificationSettings({ userId, token }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  const notificationTypes = [
    {
      type: 'equipment_alert',
      label: 'Alertas de Equipamento',
      description: 'Notificações sobre problemas e mudanças de status em equipamentos',
      icon: <AlertCircle className="w-5 h-5" />
    },
    {
      type: 'service_order_update',
      label: 'Ordens de Serviço',
      description: 'Atualizações sobre novas ordens de serviço e mudanças de status',
      icon: <Settings className="w-5 h-5" />
    },
    {
      type: 'maintenance_due',
      label: 'Manutenções Programadas',
      description: 'Lembretes sobre manutenções preventivas próximas do vencimento',
      icon: <Bell className="w-5 h-5" />
    },
    {
      type: 'maintenance_overdue',
      label: 'Manutenções Vencidas',
      description: 'Alertas sobre manutenções preventivas em atraso',
      icon: <AlertCircle className="w-5 h-5" />
    },
    {
      type: 'system_alert',
      label: 'Alertas do Sistema',
      description: 'Notificações sobre problemas gerais e alertas administrativos',
      icon: <Monitor className="w-5 h-5" />
    }
  ];

  // Carregar configurações
  const loadSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar configurações');
      }

      const data = await response.json();
      setSettings(data.settings || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Salvar configurações
  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar configurações');
      }

      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setSaving(false);
    }
  };

  // Verificar suporte a push notifications
  const checkPushSupport = () => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setPushSupported(supported);
    
    if (supported) {
      setPushPermission(Notification.permission);
    }
  };

  // Solicitar permissão para notificações
  const requestNotificationPermission = async () => {
    if (!pushSupported) return;

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      
      if (permission === 'granted') {
        setSuccess('Permissão para notificações concedida!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Permissão para notificações negada');
      }
    } catch (err) {
      setError('Erro ao solicitar permissão para notificações');
    }
  };

  // Atualizar configuração específica
  const updateSetting = (type: string, field: keyof NotificationSetting, value: boolean) => {
    setSettings(prev => {
      const existing = prev.find(s => s.notification_type === type);
      
      if (existing) {
        return prev.map(s => 
          s.notification_type === type 
            ? { ...s, [field]: value }
            : s
        );
      } else {
        // Criar nova configuração
        const newSetting: NotificationSetting = {
          id: 0, // Será definido pelo backend
          user_id: userId,
          notification_type: type,
          push_enabled: field === 'push_enabled' ? value : true,
          email_enabled: field === 'email_enabled' ? value : false,
          sound_enabled: field === 'sound_enabled' ? value : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        return [...prev, newSetting];
      }
    });
  };

  // Obter configuração para um tipo
  const getSetting = (type: string): NotificationSetting | null => {
    return settings.find(s => s.notification_type === type) || null;
  };

  // Habilitar/desabilitar todas as notificações
  const toggleAllNotifications = (enabled: boolean) => {
    setSettings(prev => {
      const updatedSettings = [...prev];
      
      notificationTypes.forEach(({ type }) => {
        const existingIndex = updatedSettings.findIndex(s => s.notification_type === type);
        
        if (existingIndex >= 0) {
          updatedSettings[existingIndex] = {
            ...updatedSettings[existingIndex],
            push_enabled: enabled,
            email_enabled: enabled,
            sound_enabled: enabled
          };
        } else {
          updatedSettings.push({
            id: 0,
            user_id: userId,
            notification_type: type,
            push_enabled: enabled,
            email_enabled: enabled,
            sound_enabled: enabled,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });
      
      return updatedSettings;
    });
  };

  // Efeitos
  useEffect(() => {
    loadSettings();
    checkPushSupport();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Configurações de Notificações</h2>
          <p className="text-sm text-gray-600 mt-1">
            Personalize como e quando você deseja receber notificações
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => loadSettings()}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="Recarregar"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Salvando...' : 'Salvar'}</span>
          </button>
        </div>
      </div>

      {/* Mensagens */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border-l-4 border-green-400 text-green-700 rounded">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
          </div>
        </div>
      )}

      {/* Status das notificações push */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Status das Notificações Push</h3>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Suporte do navegador:</span>
            <span className={`text-sm font-medium ${pushSupported ? 'text-green-600' : 'text-red-600'}`}>
              {pushSupported ? 'Suportado' : 'Não suportado'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Permissão:</span>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${
                pushPermission === 'granted' ? 'text-green-600' :
                pushPermission === 'denied' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {pushPermission === 'granted' ? 'Concedida' :
                 pushPermission === 'denied' ? 'Negada' : 'Pendente'}
              </span>
              
              {pushPermission !== 'granted' && pushSupported && (
                <button
                  onClick={requestNotificationPermission}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                >
                  Solicitar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controles globais */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Controles Gerais</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Todas as Notificações</p>
            <p className="text-xs text-gray-500">Habilitar ou desabilitar todas as notificações de uma vez</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleAllNotifications(false)}
              className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
            >
              <BellOff className="w-4 h-4" />
              <span>Desabilitar Todas</span>
            </button>
            
            <button
              onClick={() => toggleAllNotifications(true)}
              className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span>Habilitar Todas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Configurações por tipo */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Configurações por Tipo</h3>
        
        {notificationTypes.map(({ type, label, description, icon }) => {
          const setting = getSetting(type);
          
          return (
            <div key={type} className="bg-white border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  {icon}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{label}</h4>
                  <p className="text-sm text-gray-600 mt-1">{description}</p>
                  
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Push notifications */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">Push</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={setting?.push_enabled || false}
                          onChange={(e) => updateSetting(type, 'push_enabled', e.target.checked)}
                          disabled={!pushSupported || pushPermission !== 'granted'}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Email notifications */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Monitor className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">Email</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={setting?.email_enabled || false}
                          onChange={(e) => updateSetting(type, 'email_enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Sound notifications */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {setting?.sound_enabled ? (
                          <Volume2 className="w-4 h-4 text-gray-500" />
                        ) : (
                          <VolumeX className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="text-sm text-gray-700">Som</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={setting?.sound_enabled || false}
                          onChange={(e) => updateSetting(type, 'sound_enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Informações adicionais */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Informações Importantes</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• As notificações push funcionam apenas quando o navegador está aberto</li>
          <li>• As configurações são salvas automaticamente quando você clica em "Salvar"</li>
          <li>• Você pode desabilitar notificações específicas a qualquer momento</li>
          <li>• As notificações por email são enviadas para o endereço cadastrado em seu perfil</li>
        </ul>
      </div>
    </div>
  );
}