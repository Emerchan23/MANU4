"use client"

import { Bars3Icon, UserIcon, ArrowRightOnRectangleIcon, ChevronDownIcon } from "@heroicons/react/24/outline"
import { LogOut, User, Settings } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
// import { getCurrentUser, logoutUser } from "@/lib/auth-client" // Authentication removed
// import { NotificationBadge } from "@/src/components/NotificationBadge" // Removed - Central de Notificações removida
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationBell } from "@/components/notifications/notification-bell"
import NotificationCenter from "@/src/components/NotificationCenter"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface HeaderProps {
  onMenuClick: () => void
}

// Função para determinar a saudação baseada no horário
function getGreeting(): string {
  const now = new Date()
  const hour = now.getHours()
  
  if (hour >= 6 && hour < 12) {
    return "Bom dia"
  } else if (hour >= 12 && hour < 18) {
    return "Boa tarde"
  } else {
    return "Boa noite"
  }
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()
  
  // Estado para a saudação e nome do usuário
  const [greeting, setGreeting] = useState<string>("")
  const [userName, setUserName] = useState<string>("Usuário")
  const [showNotifications, setShowNotifications] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  

  
  // Atualizar saudação a cada minuto
  useEffect(() => {
    const updateGreeting = () => {
      setGreeting(getGreeting())
    }
    
    // Definir saudação inicial
    updateGreeting()
    
    // Atualizar a cada minuto
    const interval = setInterval(updateGreeting, 60000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Verificar se o usuário está logado
  useEffect(() => {
    const checkAuthStatus = () => {
      console.log('🔍 Verificando status de autenticação...')
      
      // Verificar se existe token de autenticação
      const authToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
      
      console.log('🍪 Auth token encontrado:', !!authToken)
      
      // Verificar dados do usuário no localStorage
      const storedUserName = localStorage.getItem('userName')
      const storedUserRole = localStorage.getItem('userRole')
      
      console.log('💾 LocalStorage - userName:', storedUserName)
      console.log('💾 LocalStorage - userRole:', storedUserRole)
      
      // Para teste, vamos forçar o usuário como logado
      const forceLogin = true
      
      if (authToken || storedUserName || forceLogin) {
        console.log('✅ Usuário detectado como logado')
        setIsLoggedIn(true)
        setUserName(storedUserName || 'Administrador')
        setUser({
          name: storedUserName || 'Administrador',
          role: storedUserRole || 'admin'
        })
      } else {
        console.log('❌ Usuário não logado')
        setIsLoggedIn(false)
        setUser(null)
        setUserName('Usuário')
      }
    }
    
    checkAuthStatus()
    
    // Verificar periodicamente se o status mudou
    const interval = setInterval(checkAuthStatus, 5000)
    
    return () => clearInterval(interval)
  }, [])
  
  console.log('🔍 Header renderizado - isLoggedIn:', isLoggedIn)
  console.log('🔍 Header renderizado - Usuário:', user)

  const getRoleBadgeVariant = (profile: string) => {
    switch (profile) {
      case "admin":
        return "default"
      case "gestor":
        return "secondary"
      case "usuario":
        return "outline"
      default:
        return "outline"
    }
  }

  const getRoleDisplayName = (profile: string) => {
    switch (profile) {
      case "admin":
        return "ADMIN"
      case "gestor":
        return "GESTOR"
      case "usuario":
        return "USUÁRIO"
      default:
        return profile ? profile.toUpperCase() : "USUÁRIO"
    }
  }

  const handleLogout = async () => {
    console.log('🚪 Logout clicado')
    
    try {
      // Chamar API de logout
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        console.log('✅ Logout realizado com sucesso')
      } else {
        console.warn('⚠️ Erro na API de logout, mas continuando...')
      }
    } catch (error) {
      console.warn('⚠️ Erro ao chamar API de logout:', error)
    }
    
    // Clear any stored user data
    localStorage.removeItem('userName')
    localStorage.removeItem('userRole')
    localStorage.removeItem('authToken')
    
    // Atualizar estado local
    setIsLoggedIn(false)
    setUser(null)
    setUserName('Usuário')
    
    // Redirect to login page
    window.location.href = '/login'
  }

  const handleDropdownTriggerClick = () => {
    console.log('🎯 Dropdown trigger clicado')
    setDropdownOpen(!dropdownOpen)
  }

  const handleUserAreaClick = (e: React.MouseEvent) => {
    console.log('👤 Área do usuário clicada:', e.target)
    e.preventDefault()
    e.stopPropagation()
  }

  const handleProfileClick = () => {
    console.log('👤 Perfil clicado')
    router.push('/perfil')
    setDropdownOpen(false)
  }

  const handleSettingsClick = () => {
    console.log('⚙️ Configurações clicado')
    router.push('/configuracoes')
    setDropdownOpen(false)
  }

  // Versão simplificada sempre visível para debug
  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button type="button" className="-m-2.5 p-2.5 text-muted-foreground lg:hidden" onClick={onMenuClick}>
        <Bars3Icon className="h-6 w-6" />
      </button>

      <div className="h-6 w-px bg-border lg:hidden" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          <h2 className="text-lg font-semibold text-foreground">Sistema de Manutenção Hospitalar</h2>
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <ThemeToggle />
          
          {/* Centro de Notificações */}
          <NotificationCenter compact={true} maxItems={5} />

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" />

          {/* Debug: Status do usuário */}
          <div className="text-xs text-muted-foreground">
            Status: {isLoggedIn ? 'Logado' : 'Não logado'} | User: {user?.name || 'Nenhum'}
          </div>

          {/* Botão de logout sempre visível para teste */}
          <Button 
            onClick={handleLogout}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            SAIR
          </Button>

          {/* Menu do Usuário com melhor visibilidade */}
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost"
                className="flex items-center space-x-3 h-auto p-2 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground border border-border/50 hover:border-border"
                onClick={handleDropdownTriggerClick}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium leading-none">
                      {user?.name || 'Usuário'}
                    </span>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {getRoleDisplayName(user?.role)}
                    </Badge>
                  </div>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              sideOffset={8}
              className="w-64 p-2"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || 'Usuário'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {getRoleDisplayName(user?.role)}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleProfileClick}
                className="cursor-pointer hover:bg-accent focus:bg-accent"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleSettingsClick}
                className="cursor-pointer hover:bg-accent focus:bg-accent"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/20"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="font-medium">Sair da Conta</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
