import React, { useState, useEffect } from 'react';
import { Bell, Settings, History, LogOut, User, Menu, X } from 'lucide-react';
import NotificationBell from './NotificationBell';
import NotificationPanel from './NotificationPanel';
import NotificationSettings from './NotificationSettings';
import NotificationHistory from './NotificationHistory';
import { useNotifications } from '../hooks/useNotifications';

const NotificationInterface = ({ userId = 1, userName = 'Usuário', onLogout }) => {
  const [activeTab, setActiveTab] = useState('notifications');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { unreadCount, connectionStatus } = useNotifications(userId);

  // Fechar menu mobile ao trocar de aba
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  const tabs = [
    {
      id: 'notifications',
      label: 'Notificações',
      icon: Bell,
      component: NotificationPanel,
      badge: unreadCount > 0 ? unreadCount : null
    },
    {
      id: 'history',
      label: 'Histórico',
      icon: History,
      component: NotificationHistory
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings,
      component: NotificationSettings
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Fallback para logout padrão
      if (window.confirm('Deseja realmente sair do sistema?')) {
        localStorage.removeItem('user');
        sessionStorage.clear();
        window.location.href = '/login';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Sistema de Manutenção
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <div className="relative">
                      <Icon className="h-5 w-5" />
                      {tab.badge && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {tab.badge > 99 ? '99+' : tab.badge}
                        </span>
                      )}
                    </div>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="hidden sm:flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-xs text-gray-500">
                  {connectionStatus === 'connected' ? 'Online' : 
                   connectionStatus === 'connecting' ? 'Conectando...' : 'Offline'}
                </span>
              </div>

              {/* Notification Bell (Mobile) */}
              <div className="md:hidden">
                <NotificationBell userId={userId} />
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-2">
                <div className="hidden sm:block">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-700">{userName}</span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                  title="Sair do sistema"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <div className="relative">
                      <Icon className="h-5 w-5" />
                      {tab.badge && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {tab.badge > 99 ? '99+' : tab.badge}
                        </span>
                      )}
                    </div>
                    <span>{tab.label}</span>
                  </button>
                );
              })}

              {/* Mobile User Info */}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-700">{userName}</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500' : 
                    connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {ActiveComponent && <ActiveComponent userId={userId} />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
            <div>
              © 2024 Sistema de Manutenção. Todos os direitos reservados.
            </div>
            <div className="flex items-center space-x-4 mt-2 sm:mt-0">
              <span>Versão 1.0.0</span>
              <span>•</span>
              <span className={`flex items-center space-x-1 ${
                connectionStatus === 'connected' ? 'text-green-600' : 
                connectionStatus === 'connecting' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span>
                  {connectionStatus === 'connected' ? 'Sistema Online' : 
                   connectionStatus === 'connecting' ? 'Conectando...' : 'Sistema Offline'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NotificationInterface;