"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

interface UserPreferences {
  theme: string
  notifications: boolean
  dashboardLayout: string
  itemsPerPage: number
}

interface UserPreferencesContextType {
  preferences: UserPreferences
  updatePreferences: (newPreferences: Partial<UserPreferences>) => void
  loadPreferences: () => Promise<void>
  isLoading: boolean
}

const defaultPreferences: UserPreferences = {
  theme: "light",
  notifications: true,
  dashboardLayout: "default",
  itemsPerPage: 25
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined)

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [isLoading, setIsLoading] = useState(true)
  const { setTheme } = useTheme()

  const loadPreferences = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/profile', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        const userPreferences: UserPreferences = {
          theme: data.preferences.theme || defaultPreferences.theme,
          notifications: data.preferences.notifications !== undefined ? data.preferences.notifications : defaultPreferences.notifications,
          dashboardLayout: data.preferences.dashboardLayout || defaultPreferences.dashboardLayout,
          itemsPerPage: data.preferences.itemsPerPage || defaultPreferences.itemsPerPage
        }
        
        setPreferences(userPreferences)
        
        // Aplicar o tema automaticamente
        setTheme(userPreferences.theme)
      }
    } catch (error) {
      console.error('Erro ao carregar preferências do usuário:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPreferences }
      
      // Se o tema foi alterado, aplicar imediatamente
      if (newPreferences.theme && newPreferences.theme !== prev.theme) {
        setTheme(newPreferences.theme)
      }
      
      return updated
    })
  }

  useEffect(() => {
    loadPreferences()
  }, [])

  return (
    <UserPreferencesContext.Provider value={{
      preferences,
      updatePreferences,
      loadPreferences,
      isLoading
    }}>
      {children}
    </UserPreferencesContext.Provider>
  )
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext)
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider')
  }
  return context
}