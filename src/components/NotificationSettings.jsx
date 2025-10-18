import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Bell, BellOff, TestTube, Check, X, AlertCircle } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

const NotificationSettings = ({ userId = 1, onClose }) => {
  const {
    settings,
    loading,
    error,
    updateSettings,
    initializePushNotifications,
    testNotification,
    getNotificationStatus,
    clearError
  } = useNotifications(userId);

  const [localSettings, setLocalSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [pushStatus, setPushStatus] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Configurações disponíveis
  const settingsConfig = [
    {
      key: 'equipment_failure',
      title: 'Falhas de Equipamento',
      description: 'Notificações quando equipamentos apresentam falhas',
      icon: '⚠️',
      color: 'text-red-600'
    },
    {
      key: 'maintenance_due',
      title: 'Manutenção Vencida',
      description: 'Alertas sobre manutenções preventivas vencidas',
      icon: '🔧',
      color: 'text-yellow-600'
    },
    {
      key: 'service_order_assigned',
      title: 'Ordem de Serviço Atribuída',
      description: 'Quando uma nova ordem de serviço é atribuída a você',
      icon: '📋',
      color: 'text-blue-600'
    },
    {
      key: 'service_order_completed',
      title: 'Ordem de Serviço Concluída',
      description: 'Quando uma ordem de serviço é marcada como concluída',
      icon: '✅',
      color: 'text-green-600'
    },
    {
      key: 'system_alerts',
      title: 'Alertas do Sistema',
      description: 'Notificações gerais do sistema e atualizações',
      icon: '🔔',
      color: 'text-purple-600'
    }
  ];

  // Sincronizar configurações locais
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Verificar status das notificações push
  useEffect(() => {
    const checkPushStatus = () => {
      const status = getNotificationStatus();
      setPushStatus(status);
    };

    checkPushStatus();
    const interval = setInterval(checkPushStatus, 5000);
    return () => clearInterval(interval);
  }, [getNotificationStatus]);

  // Atualizar configuração individual
  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Salvar configurações
  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSettings(localSettings);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setSaving(false);
    }
  };

  // Habilitar notificações push
  const handleEnablePush = async () => {
    try {
      setSaving(true);
      await initializePushNotifications();
      
      // Atualizar status
      const status = getNotificationStatus();
      setPushStatus(status);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao habilitar push notifications:', error);
    } finally {
      setSaving(false);
    }
  };

  // Testar notificação
  const handleTest = async () => {
    try {
      setTesting(true);
      await testNotification();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao testar notificação:', error);
    } finally {
      setTesting(false);
    }
  };

  // Resetar configurações
  const handleReset = () => {
    const defaultSettings = {};
    settingsConfig.forEach(config => {
      defaultSettings[config.key] = true;
    });
    setLocalSettings(defaultSettings);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Configurações de Notificação
          </h2>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Mensagens de status */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-700">Configurações salvas com sucesso!</p>
          </div>
        </div>
      )}

      {/* Status das notificações push */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Status das Notificações Push</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Suporte do navegador:</span>
            <span className={`font-medium ${pushStatus?.isSupported ? 'text-green-600' : 'text-red-600'}`}>
              {pushStatus?.isSupported ? 'Suportado' : 'Não suportado'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Permissão:</span>
            <span className={`font-medium ${
              pushStatus?.permission === 'granted' ? 'text-green-600' : 
              pushStatus?.permission === 'denied' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {pushStatus?.permission === 'granted' ? 'Concedida' :
               pushStatus?.permission === 'denied' ? 'Negada' : 'Pendente'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Service Worker:</span>
            <span className={`font-medium ${pushStatus?.hasRegistration ? 'text-green-600' : 'text-red-600'}`}>
              {pushStatus?.hasRegistration ? 'Registrado' : 'Não registrado'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Subscription:</span>
            <span className={`font-medium ${pushStatus?.hasSubscription ? 'text-green-600' : 'text-red-600'}`}>
              {pushStatus?.hasSubscription ? 'Ativa' : 'Inativa'}
            </span>
          </div>
        </div>

        {/* Botões de ação para push notifications */}
        <div className="flex space-x-2 mt-4">
          {!pushStatus?.hasSubscription && (
            <button
              onClick={handleEnablePush}
              disabled={saving || !pushStatus?.isSupported}
              className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Bell className="h-4 w-4" />
              <span>{saving ? 'Habilitando...' : 'Habilitar Push'}</span>
            </button>
          )}
          
          <button
            onClick={handleTest}
            disabled={testing || !pushStatus?.hasSubscription}
            className="flex items-center space-x-1 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <TestTube className="h-4 w-4" />
            <span>{testing ? 'Testando...' : 'Testar'}</span>
          </button>
        </div>
      </div>

      {/* Configurações de tipos de notificação */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Tipos de Notificação</h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-3">
            {settingsConfig.map((config) => (
              <div
                key={config.key}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start space-x-3">
                  <div className={`text-xl ${config.color}`}>
                    {config.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {config.title}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {config.description}
                    </p>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings[config.key] || false}
                    onChange={(e) => handleSettingChange(config.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Restaurar Padrões
        </button>
        
        <div className="flex space-x-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md"
            >
              Cancelar
            </button>
          )}
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? 'Salvando...' : 'Salvar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;