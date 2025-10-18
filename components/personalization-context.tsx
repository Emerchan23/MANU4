"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useTheme } from "next-themes"

interface PersonalizationSettings {
  primaryColor: string
  interfaceSize: string
  borderRadius: number
  showAnimations: boolean
  compactSidebar: boolean
  showBreadcrumbs: boolean
  highContrast: boolean
}

interface PersonalizationContextType {
  settings: PersonalizationSettings
  updateSettings: (newSettings: Partial<PersonalizationSettings>) => void
  applySettings: () => void
}

const defaultSettings: PersonalizationSettings = {
  primaryColor: "blue",
  interfaceSize: "comfortable",
  borderRadius: 10,
  showAnimations: true,
  compactSidebar: false,
  showBreadcrumbs: true,
  highContrast: false,
}

const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined)

const primaryColors = {
  blue: "oklch(0.488 0.243 264.376)",
  green: "oklch(0.646 0.222 142.495)",
  red: "oklch(0.577 0.245 27.325)",
  purple: "oklch(0.627 0.265 303.9)",
  orange: "oklch(0.769 0.188 70.08)",
  teal: "oklch(0.6 0.118 184.704)",
}

export function PersonalizationProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PersonalizationSettings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { setTheme } = useTheme()

  // Ensure component is mounted on client side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load global system settings from database on mount
  useEffect(() => {
    if (isMounted) {
      loadGlobalSettings()
    }
  }, [isMounted])

  // Apply settings only when component is loaded and mounted
  useEffect(() => {
    if (isLoaded && isMounted) {
      applySettingsToDOM()
    }
  }, [isLoaded, isMounted, settings])

  const loadGlobalSettings = async () => {
    try {
      console.log('🔄 Carregando configurações globais de personalização...')
      
      // Sempre usar configurações padrão primeiro para evitar tela preta
      setSettings(defaultSettings)
      setIsLoaded(true)
      
      // Tentar carregar configurações da API em background
      const response = await fetch('/api/global-settings')
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Configurações globais carregadas:', data)
        
        if (data.success && data.data) {
          const globalSettings = {
            primaryColor: data.data.primary_color || defaultSettings.primaryColor,
            interfaceSize: data.data.interface_size || defaultSettings.interfaceSize,
            borderRadius: data.data.border_radius || defaultSettings.borderRadius,
            showAnimations: data.data.show_animations !== undefined ? data.data.show_animations : defaultSettings.showAnimations,
            compactSidebar: data.data.compact_sidebar !== undefined ? data.data.compact_sidebar : defaultSettings.compactSidebar,
            showBreadcrumbs: data.data.show_breadcrumbs !== undefined ? data.data.show_breadcrumbs : defaultSettings.showBreadcrumbs,
            highContrast: data.data.high_contrast !== undefined ? data.data.high_contrast : defaultSettings.highContrast,
          }
          
          console.log('🎨 Aplicando configurações globais:', globalSettings)
          setSettings(globalSettings)
          // Apply the new settings immediately
          setTimeout(() => applySettingsToDOM(), 0)
        } else {
          console.log('⚠️ Dados inválidos na resposta da API, mantendo configurações padrão')
        }
      } else {
        console.log('⚠️ Erro na resposta da API (status:', response.status, '), mantendo configurações padrão')
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configurações globais:', error)
      console.log('🔄 Mantendo configurações padrão para evitar falhas')
      // Não fazer nada - já temos as configurações padrão aplicadas
    }
  }

  // Apply settings to CSS variables only
  const applySettingsToDOM = () => {
    try {
      // Only run on client side
      if (typeof window === 'undefined') return
      
      const root = document.documentElement
      
      // Apply primary color
      const colorValue = primaryColors[settings.primaryColor as keyof typeof primaryColors] || primaryColors.blue
      root.style.setProperty('--primary', colorValue)
      
      // Apply border radius
      root.style.setProperty('--radius', `${settings.borderRadius}px`)
      
      // Apply interface size classes - avoid hydration mismatch by checking current class
      const currentInterfaceClass = Array.from(root.classList).find(cls => cls.startsWith('interface-'))
      const newInterfaceClass = `interface-${settings.interfaceSize}`
      
      if (currentInterfaceClass !== newInterfaceClass) {
        root.classList.remove('interface-compact', 'interface-comfortable', 'interface-spacious')
        root.classList.add(newInterfaceClass)
      }
      
      // Apply other settings as CSS custom properties
      root.style.setProperty('--show-animations', settings.showAnimations ? '1' : '0')
      root.style.setProperty('--compact-sidebar', settings.compactSidebar ? '1' : '0')
      root.style.setProperty('--show-breadcrumbs', settings.showBreadcrumbs ? '1' : '0')
      root.style.setProperty('--high-contrast', settings.highContrast ? '1' : '0')
      
      console.log('🎨 Configurações aplicadas ao DOM:', settings)
    } catch (error) {
      console.error('❌ Erro ao aplicar configurações ao DOM:', error)
    }
  }

  const updateSettings = async (newSettings: Partial<PersonalizationSettings>) => {
    try {
      console.log('🔄 Atualizando configurações:', newSettings)
      
      const updatedSettings = { ...settings, ...newSettings }
      setSettings(updatedSettings)
      // Apply settings immediately after update
      setTimeout(() => applySettingsToDOM(), 0)
      
      // Try to save to API but don't block UI if it fails
      try {
        const response = await fetch('/api/global-settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            primary_color: updatedSettings.primaryColor,
            interface_size: updatedSettings.interfaceSize,
            border_radius: updatedSettings.borderRadius,
            show_animations: updatedSettings.showAnimations,
            compact_sidebar: updatedSettings.compactSidebar,
            show_breadcrumbs: updatedSettings.showBreadcrumbs,
            high_contrast: updatedSettings.highContrast,
          }),
        })
        
        if (response.ok) {
          console.log('✅ Configurações salvas no servidor')
        } else {
          console.log('⚠️ Erro ao salvar configurações no servidor, mas mantendo localmente')
        }
      } catch (saveError) {
        console.error('❌ Erro ao salvar configurações:', saveError)
        console.log('🔄 Configurações mantidas localmente')
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar configurações:', error)
    }
  }

  const applySettings = () => {
    applySettingsToDOM()
  }

  // Render children even if settings are not loaded to prevent blank screen
  return (
    <PersonalizationContext.Provider value={{
      settings,
      updateSettings,
      applySettings,
    }}>
      {children}
    </PersonalizationContext.Provider>
  )
}

export function usePersonalization() {
  const context = useContext(PersonalizationContext)
  if (context === undefined) {
    console.error('❌ usePersonalization deve ser usado dentro de PersonalizationProvider')
    // Return default values instead of throwing to prevent crashes
    return {
      settings: defaultSettings,
      updateSettings: () => {},
      applySettings: () => {},
    }
  }
  return context
}
