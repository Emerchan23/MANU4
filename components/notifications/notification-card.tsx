"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  SpeakerWaveIcon,
  WrenchScrewdriverIcon,
  TrashIcon
} from "@heroicons/react/24/outline"
import { formatTimeAgo, getNotificationIcon } from "@/lib/notifications"
import type { Notification } from "@/lib/notifications"

interface NotificationCardProps {
  notification: Notification
  onMarkAsRead?: (id: number) => void
  onMarkAsUnread?: (id: number) => void
  onDelete?: (id: number) => void
}

export function NotificationCard({ 
  notification, 
  onMarkAsRead, 
  onMarkAsUnread,
  onDelete 
}: NotificationCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggleRead = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      if (notification.read_status) {
        onMarkAsUnread?.(notification.id)
      } else {
        onMarkAsRead?.(notification.id)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (isDeleting) return
    
    // Confirmação antes de deletar
    if (!confirm('Tem certeza que deseja deletar esta notificação?')) {
      return
    }
    
    setIsDeleting(true)
    try {
      onDelete?.(notification.id)
    } finally {
      setIsDeleting(false)
    }
  }

  const getTypeIcon = () => {
    switch (notification.type) {
      case "manutencao_preventiva":
        return <WrenchScrewdriverIcon className="h-5 w-5 text-blue-600" />
      case "servico_atrasado":
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
      case "administrativo":
        return <SpeakerWaveIcon className="h-5 w-5 text-purple-600" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getTypeBadgeColor = () => {
    switch (notification.type) {
      case "manutencao_preventiva":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "servico_atrasado":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "administrativo":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getTypeLabel = () => {
    switch (notification.type) {
      case "manutencao_preventiva":
        return "Manutenção"
      case "servico_atrasado":
        return "Atraso"
      case "administrativo":
        return "Sistema"
      default:
        return "Notificação"
    }
  }

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      !notification.read_status 
        ? "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20" 
        : "border-l-4 border-l-transparent"
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Ícone do tipo */}
          <div className="flex-shrink-0 mt-0.5">
            {getTypeIcon()}
          </div>
          
          {/* Conteúdo principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={`text-sm font-medium ${
                  !notification.read_status ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {notification.title}
                </h4>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getTypeBadgeColor()}`}
                >
                  {getTypeLabel()}
                </Badge>
                {!notification.read_status && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                )}
              </div>
              
              {/* Botões de ação */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Botão de marcar como lida/não lida */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleRead}
                  disabled={isLoading || isDeleting}
                  className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
                  title={notification.read_status ? "Marcar como não lida" : "Marcar como lida"}
                >
                  <CheckCircleIcon className={`h-4 w-4 transition-colors ${
                    notification.read_status 
                      ? "text-green-600" 
                      : "text-gray-400 hover:text-green-600"
                  }`} />
                </Button>
                
                {/* Botão de deletar */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isLoading || isDeleting}
                  className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                  title="Deletar notificação"
                >
                  <TrashIcon className={`h-4 w-4 transition-colors ${
                    isDeleting 
                      ? "text-red-400 animate-pulse" 
                      : "text-gray-400 hover:text-red-600"
                  }`} />
                </Button>
              </div>
            </div>
            
            {/* Mensagem */}
            <p className={`text-sm mb-3 ${
              !notification.read_status ? "text-foreground" : "text-muted-foreground"
            }`}>
              {notification.message}
            </p>
            
            {/* Informações adicionais */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>{formatTimeAgo(notification.created_at)}</span>
                {notification.related_name && (
                  <span className="flex items-center gap-1">
                    <span>•</span>
                    <span>{notification.related_name}</span>
                  </span>
                )}
              </div>
              
              {notification.read_status && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircleIcon className="h-3 w-3" />
                  <span>Lida</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}