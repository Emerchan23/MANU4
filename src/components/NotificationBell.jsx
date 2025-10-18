import React, { useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationPanel from './NotificationPanel';

const NotificationBell = ({ userId = 1, className = '' }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { unreadCount, isConnected } = useNotifications(userId);

  const handleClick = () => {
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  return (
    <>
      {/* Botão do sino */}
      <button
        onClick={handleClick}
        className={`relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
        title="Notificações"
      >
        {/* Ícone do sino */}
        {unreadCount > 0 ? (
          <BellRing className="h-6 w-6" />
        ) : (
          <Bell className="h-6 w-6" />
        )}
        
        {/* Badge de contador */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[1.25rem] h-5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Indicador de conexão */}
        <div 
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
          title={isConnected ? 'Conectado' : 'Desconectado'}
        />
      </button>

      {/* Panel de notificações */}
      <NotificationPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        userId={userId}
      />
    </>
  );
};

export default NotificationBell;