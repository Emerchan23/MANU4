"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  BellIcon, 
  CheckIcon,
  XMarkIcon,
  TrashIcon
} from "@heroicons/react/24/outline"
import { BellIcon as BellSolidIcon } from "@heroicons/react/24/solid"
import { useNotifications } from "@/lib/notifications"
import { NotificationCard } from "./notification-card"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showAllRead, setShowAllRead] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    refresh: refreshNotifications,
    deleteNotification,
    deleteAllNotifications,
    deleteReadNotifications
  } = useNotifications()

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      refreshNotifications()
    }
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id)
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      await markAllAsRead()
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteNotification = async (id: number) => {
    try {
      await deleteNotification(id)
      toast.success('Notificação deletada com sucesso!')
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
      toast.error('Erro ao deletar notificação')
    }
  }

  const handleDeleteAllNotifications = async () => {
    if (isLoading) return
    
    // Confirmação antes de deletar todas
    if (!confirm('Tem certeza que deseja deletar TODAS as notificações? Esta ação não pode ser desfeita.')) {
      return
    }
    
    setIsLoading(true)
    try {
      await deleteAllNotifications()
      toast.success('Todas as notificações foram deletadas!')
    } catch (error) {
      console.error('Erro ao deletar todas as notificações:', error)
      toast.error('Erro ao deletar todas as notificações')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteReadNotifications = async () => {
    if (isLoading) return
    
    // Confirmação antes de deletar notificações lidas
    if (!confirm('Tem certeza que deseja deletar todas as notificações lidas? Esta ação não pode ser desfeita.')) {
      return
    }
    
    setIsLoading(true)
    try {
      await deleteReadNotifications()
      toast.success('Notificações lidas foram deletadas!')
    } catch (error) {
      console.error('Erro ao deletar notificações lidas:', error)
      toast.error('Erro ao deletar notificações lidas')
    } finally {
      setIsLoading(false)
    }
  }

  const unreadNotifications = notifications.filter(n => !n.read_status)
  const readNotifications = notifications.filter(n => n.read_status)

  return (
    <div className="relative">
      {/* Botão do sino */}
      <Button 
        ref={buttonRef}
        variant="ghost" 
        size="sm" 
        className="relative"
        onClick={handleToggleDropdown}
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="h-5 w-5 text-blue-600" />
        ) : (
          <BellIcon className="h-5 w-5" />
        )}
        
        {/* Badge de contador */}
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs font-bold min-w-[20px]"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown de notificações */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className={cn(
            "absolute right-0 top-full mt-2 w-96 max-w-[90vw]",
            "bg-background border border-border rounded-lg shadow-lg z-50",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">Notificações</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={isLoading}
                  className="text-xs h-7 px-2 hover:bg-green-100 dark:hover:bg-green-900/20"
                  title="Marcar todas como lidas"
                >
                  <CheckIcon className="h-3 w-3 mr-1" />
                  Marcar todas
                </Button>
              )}
              
              {readNotifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteReadNotifications}
                  disabled={isLoading}
                  className="text-xs h-7 px-2 hover:bg-red-100 dark:hover:bg-red-900/20"
                  title="Deletar notificações lidas"
                >
                  <TrashIcon className="h-3 w-3 mr-1" />
                  Deletar lidas
                </Button>
              )}
              
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteAllNotifications}
                  disabled={isLoading}
                  className="text-xs h-7 px-2 hover:bg-red-100 dark:hover:bg-red-900/20"
                  title="Deletar todas as notificações"
                >
                  <TrashIcon className="h-3 w-3 mr-1" />
                  Deletar todas
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 p-0"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Lista de notificações */}
          <ScrollArea className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <BellIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="p-2">
                {/* Notificações não lidas */}
                {unreadNotifications.length > 0 && (
                  <div className="mb-4">
                    <div className="px-2 py-1 mb-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Não lidas ({unreadNotifications.length})
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {unreadNotifications.map((notification) => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                          onDelete={handleDeleteNotification}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Separador */}
                {unreadNotifications.length > 0 && readNotifications.length > 0 && (
                  <Separator className="my-4" />
                )}

                {/* Notificações lidas */}
                {readNotifications.length > 0 && (
                  <div>
                    <div className="px-2 py-1 mb-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Lidas ({readNotifications.length})
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {(showAllRead ? readNotifications : readNotifications.slice(0, 5)).map((notification) => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                          onDelete={handleDeleteNotification}
                        />
                      ))}
                      {readNotifications.length > 5 && (
                        <div className="text-center py-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs"
                            onClick={() => setShowAllRead(!showAllRead)}
                          >
                            {showAllRead 
                              ? `Ver menos` 
                              : `Ver mais ${readNotifications.length - 5} notificações`
                            }
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
