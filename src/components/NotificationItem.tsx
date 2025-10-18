// Item individual de notificação
import React from 'react';
import { 
  AlertTriangle, 
  Wrench, 
  Calendar, 
  AlertCircle, 
  Info,
  Check,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Notification } from './NotificationPanel';

interface NotificationItemProps {
  notification: Notification;
  isSelected: boolean;
  onToggleSelection: () => void;
  onMarkAsRead: () => void;
}

export function NotificationItem({ 
  notification, 
  isSelected, 
  onToggleSelection, 
  onMarkAsRead 
}: NotificationItemProps) {
  
  // Ícone baseado no tipo
  const getTypeIcon = () => {
    switch (notification.type) {
      case 'equipment_alert':
        return <AlertTriangle className="w-5 h-5" />;
      case 'service_order_update':
        return <Wrench className="w-5 h-5" />;
      case 'maintenance_due':
      case 'maintenance_overdue':
        return <Calendar className="w-5 h-5" />;
      case 'system_alert':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  // Cor baseada na prioridade
  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Tradução do tipo
  const getTypeLabel = () => {
    switch (notification.type) {
      case 'equipment_alert':
        return 'Alerta de Equipamento';
      case 'service_order_update':
        return 'Ordem de Serviço';
      case 'maintenance_due':
        return 'Manutenção Programada';
      case 'maintenance_overdue':
        return 'Manutenção Vencida';
      case 'system_alert':
        return 'Alerta do Sistema';
      default:
        return 'Notificação';
    }
  };

  // Tradução da prioridade
  const getPriorityLabel = () => {
    switch (notification.priority) {
      case 'critical':
        return 'Crítica';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa';
      default:
        return 'Normal';
    }
  };

  // Formatação da data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Link para o item relacionado
  const getRelatedLink = () => {
    switch (notification.related_type) {
      case 'equipment':
        return `/equipments/${notification.related_id}`;
      case 'service_order':
        return `/service-orders/${notification.related_id}`;
      case 'maintenance':
        return `/maintenances/${notification.related_id}`;
      default:
        return null;
    }
  };

  const relatedLink = getRelatedLink();

  return (
    <div 
      className={`p-4 hover:bg-gray-50 transition-colors ${
        !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      } ${isSelected ? 'bg-blue-100' : ''}`}
    >
      <div className="flex items-start space-x-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelection}
          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />

        {/* Ícone do tipo */}
        <div className={`p-2 rounded-lg border ${getPriorityColor()}`}>
          {getTypeIcon()}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Título */}
              <h3 className={`text-sm font-medium ${
                !notification.is_read ? 'text-gray-900' : 'text-gray-700'
              }`}>
                {notification.title}
              </h3>

              {/* Mensagem */}
              <p className={`mt-1 text-sm ${
                !notification.is_read ? 'text-gray-800' : 'text-gray-600'
              }`}>
                {notification.message}
              </p>

              {/* Metadados */}
              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <span>{getTypeLabel()}</span>
                </span>
                
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor()}`}>
                  {getPriorityLabel()}
                </span>

                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(notification.created_at)}</span>
                </span>

                {notification.read_status && (
                  <span className={`flex items-center space-x-1 ${
                    notification.read_status === 'read' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {notification.read_status === 'read' && <Check className="w-3 h-3" />}
                    <span className="capitalize">{notification.read_status}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center space-x-2 ml-4">
              {relatedLink && (
                <a
                  href={relatedLink}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Ver detalhes"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              {!notification.is_read && (
                <button
                  onClick={onMarkAsRead}
                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                  title="Marcar como lida"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}