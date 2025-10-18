"use client"

import { useEffect } from "react"

import { useState } from "react"

export type NotificationType = "manutencao_preventiva" | "servico_atrasado" | "administrativo"

export type NotificationPriority = "low" | "medium" | "high" | "critical"

export interface Notification {
  id: number
  type: NotificationType
  title: string
  message: string
  read_status: boolean
  user_id: number
  created_at: string
  related_id?: number
  related_type?: "equipment" | "service_order"
  related_name?: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

// Clear user session from database
async function clearUserSession(): Promise<void> {
  if (typeof window === "undefined") return
  
  try {
    // Get session ID from cookie
    const sessionId = document.cookie
      .split('; ')
      .find(row => row.startsWith('sessionId='))
      ?.split('=')[1]
    
    if (sessionId) {
      // Clear session from database
      await fetch('/api/sessions?action=delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId })
      })
    }
    
    // Clear session cookie
    document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  } catch (error) {
    console.error('Error clearing user session:', error)
  }
}

// API call helper
async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  // Handle empty API_BASE_URL by defaulting to current origin
  const baseUrl = API_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")
  const url = `${baseUrl}/api${endpoint}`
  
  try {
    console.debug(`[API] ${options.method || 'GET'} ${url}`)
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for session-based auth
    })

    if (response.status === 401) {
      console.warn('[API] Unauthorized access - clearing session')
      await clearUserSession()
      // Authentication removed - no redirect needed
      return
    }

    if (!response.ok) {
      let errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`
      let errorDetails = null
      
      try {
        const errorData = await response.json()
        errorDetails = errorData
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch (parseError) {
        console.warn('[API] Failed to parse error response as JSON:', parseError)
        // Try to get text response as fallback
        try {
          const textError = await response.text()
          if (textError) {
            errorMessage = `${errorMessage} - ${textError}`
          }
        } catch (textError) {
          console.warn('[API] Failed to parse error response as text:', textError)
        }
      }
      
      console.error(`[API] Request failed:`, {
        url,
        method: options.method || 'GET',
        status: response.status,
        statusText: response.statusText,
        errorMessage,
        errorDetails
      })
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.debug(`[API] Request successful:`, { url, method: options.method || 'GET' })
    return data
    
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = 'Erro de conexão - verifique sua internet ou se o servidor está funcionando'
      console.error('[API] Network error:', { url, error: error.message })
      throw new Error(networkError)
    }
    
    // Re-throw other errors (including our custom HTTP errors)
    throw error
  }
}

// Get user notifications
export async function getNotifications(userId?: string): Promise<Notification[]> {
  try {
    // Se não foi fornecido userId, usar um padrão
    let userIdParam = userId || "1";
    
    const endpoint = `/notifications?user_id=${userIdParam}`;
    return await apiCall(endpoint);
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return []
  }
}

// Get unread notification count
export async function getUnreadCount(userId?: string): Promise<number> {
  try {
    // Se não foi fornecido userId, usar um padrão
    let userIdParam = userId || "1";
    
    const endpoint = `/notifications/count?user_id=${userIdParam}`;
    const result = await apiCall(endpoint);
    return result.count || 0;
  } catch (error) {
    console.error("Error fetching notification count:", error)
    return 0
  }
}

// Mark notification as read
export async function markAsRead(notificationId: string | number): Promise<void> {
  try {
    await apiCall(`/notifications/${notificationId}/read`, {
      method: "PUT",
    })
  } catch (error) {
    console.error("Error marking notification as read:", error)
  }
}

// Mark all notifications as read
export async function markAllAsRead(userId?: string): Promise<void> {
  try {
    await apiCall("/notifications/read-all", {
      method: "PUT",
    })
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
  }
}

// Send administrative notification
export async function sendAdminNotification(
  title: string,
  message: string,
  targetUsers?: number[],
  targetSectors?: number[],
): Promise<void> {
  try {
    await apiCall("/notifications/admin", {
      method: "POST",
      body: JSON.stringify({
        title,
        message,
        target_users: targetUsers,
        target_sectors: targetSectors,
      }),
    })
  } catch (error) {
    console.error("Error sending admin notification:", error)
    throw error
  }
}

// Delete notification
export async function deleteNotification(notificationId: string | number): Promise<void> {
  try {
    await apiCall(`/notifications/${notificationId}`, {
      method: "DELETE",
    })
  } catch (error) {
    console.error("Error deleting notification:", error)
  }
}

export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case "manutencao_preventiva":
      return "🔧"
    case "servico_atrasado":
      return "⚠️"
    case "administrativo":
      return "📢"
    default:
      return "🔔"
  }
}

export function getPriorityColor(priority: NotificationPriority): string {
  switch (priority) {
    case "critical":
      return "text-red-600"
    case "high":
      return "text-orange-600"
    case "medium":
      return "text-blue-600"
    case "low":
      return "text-gray-600"
    default:
      return "text-gray-600"
  }
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return "Agora"
  if (diffInMinutes < 60) return `${diffInMinutes}m atrás`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h atrás`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d atrás`

  return date.toLocaleDateString("pt-BR")
}

// Hook for real-time notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([getNotifications(), getUnreadCount()])
      setNotifications(notifs)
      setUnreadCount(count)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markNotificationAsRead = async (id: string | number) => {
    await markAsRead(id)
    await fetchNotifications()
  }

  const markAllNotificationsAsRead = async () => {
    await markAllAsRead()
    await fetchNotifications()
  }

  const deleteNotificationById = async (id: string | number) => {
    try {
      await apiCall(`/notifications?id=${id}`, {
        method: "DELETE",
      })
      await fetchNotifications()
    } catch (error) {
      console.error("Error deleting notification:", error)
      throw error
    }
  }

  const deleteAllNotifications = async () => {
    try {
      // Obter user_id do primeiro usuário logado (simulação)
      const userId = 1 // TODO: Obter do contexto de autenticação
      await apiCall(`/notifications?action=delete-all&user_id=${userId}`, {
        method: "DELETE",
      })
      await fetchNotifications()
    } catch (error) {
      console.error("Error deleting all notifications:", error)
      throw error
    }
  }

  const deleteReadNotifications = async () => {
    try {
      // Obter user_id do primeiro usuário logado (simulação)
      const userId = 1 // TODO: Obter do contexto de autenticação
      await apiCall(`/notifications?action=delete-read&user_id=${userId}`, {
        method: "DELETE",
      })
      await fetchNotifications()
    } catch (error) {
      console.error("Error deleting read notifications:", error)
      throw error
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)

    return () => clearInterval(interval)
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    refresh: fetchNotifications,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    deleteNotification: deleteNotificationById,
    deleteAllNotifications,
    deleteReadNotifications,
  }
}

export async function createNotification(
  userId: number,
  type: NotificationType,
  title: string,
  message: string,
  priority: NotificationPriority = "medium",
  relatedId?: number,
  relatedType?: "equipment" | "service_order",
): Promise<void> {
  try {
    await apiCall("/notifications", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        type,
        title,
        message,
        priority,
        related_id: relatedId,
        related_type: relatedType,
      }),
    })
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}
