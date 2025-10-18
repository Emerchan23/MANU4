"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Mail, Shield, Bell, Palette, Save, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"

export default function PerfilPage() {
  const { toast } = useToast()
  const { setTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Dados do usuário
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    username: "",
    role: "",
    avatar: "",
    phone: "",
    department: "",
    lastLogin: "",
    createdAt: ""
  })

  // Configurações de preferências
  const [preferences, setPreferences] = useState({
    theme: "light",
    notifications: true,
    dashboardLayout: "default",
    itemsPerPage: 25
  })

  // Dados para alteração de senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  // Carregar dados do perfil ao montar o componente
  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setUserData({
          name: data.user.name || "",
          email: data.user.email || "",
          username: data.user.username || "",
          role: data.user.role || "",
          avatar: "",
          phone: data.user.phone || "",
          department: data.user.department || "",
          lastLogin: data.user.lastLogin || "",
          createdAt: data.user.createdAt || ""
        })
        const userPreferences = {
           theme: data.preferences.theme || "light",
           notifications: data.preferences.notifications !== undefined ? data.preferences.notifications : true,
           dashboardLayout: data.preferences.dashboardLayout || "default",
           itemsPerPage: data.preferences.itemsPerPage || 25
         }
         
         setPreferences(userPreferences)
         
         // Aplicar o tema automaticamente
         setTheme(userPreferences.theme)
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.error || "Erro ao carregar dados do perfil",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      toast({
        title: "Erro",
        description: "Erro de conexão ao carregar perfil",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Função para salvar dados do perfil
  const handleSaveProfile = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          user: {
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            department: userData.department
          }
        })
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Dados do perfil salvos com sucesso!",
        })
        // Recarregar dados para garantir sincronização
        await loadProfileData()
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.error || "Erro ao salvar dados do perfil",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      toast({
        title: "Erro",
        description: "Erro de conexão ao salvar perfil",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Função para salvar preferências
   const handleSavePreferences = async () => {
     try {
       setLoading(true)
       
       const response = await fetch('/api/profile', {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json',
         },
         credentials: 'include',
         body: JSON.stringify({
           preferences: {
             theme: preferences.theme,
             notifications: preferences.notifications,
             dashboardLayout: preferences.dashboardLayout,
             itemsPerPage: preferences.itemsPerPage
           }
         })
       })

       if (response.ok) {
         // Aplicar o tema imediatamente após salvar
         setTheme(preferences.theme)
         
         toast({
           title: "Sucesso",
           description: "Preferências salvas com sucesso!",
         })
         // Recarregar dados para garantir sincronização
         await loadProfileData()
       } else {
         const error = await response.json()
         toast({
           title: "Erro",
           description: error.error || "Erro ao salvar preferências",
           variant: "destructive",
         })
       }
     } catch (error) {
       console.error('Erro ao salvar preferências:', error)
       toast({
         title: "Erro",
         description: "Erro de conexão ao salvar preferências",
         variant: "destructive",
       })
     } finally {
       setLoading(false)
     }
   }

  // Função para alterar senha
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Senha alterada com sucesso!",
        })
        // Limpar campos de senha
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.error || "Erro ao alterar senha",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      toast({
        title: "Erro",
        description: "Erro de conexão ao alterar senha",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrador"
      case "GESTOR":
        return "Gestor"
      case "TECNICO":
        return "Técnico"
      case "USUARIO":
        return "Usuário"
      default:
        return role
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "default"
      case "GESTOR":
        return "secondary"
      case "TECNICO":
        return "outline"
      case "USUARIO":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
            <p className="text-muted-foreground">
              Gerencie suas informações pessoais e preferências do sistema
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando dados do perfil...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Informações Pessoais</TabsTrigger>
              <TabsTrigger value="preferences">Preferências</TabsTrigger>
              <TabsTrigger value="security">Segurança</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription>
                  Atualize suas informações básicas do perfil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-lg">
                      {userData.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{userData.name}</h3>
                    <Badge variant={getRoleBadgeVariant(userData.role)}>
                      {getRoleDisplayName(userData.role)}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Último acesso: {new Date(userData.lastLogin).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={userData.name}
                      onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Nome de Usuário</Label>
                    <Input
                      id="username"
                      value={userData.username}
                      onChange={(e) => setUserData(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userData.email}
                      onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={userData.phone}
                      onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Input
                      id="department"
                      value={userData.department}
                      onChange={(e) => setUserData(prev => ({ ...prev, department: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Perfil de Acesso</Label>
                    <Input
                      id="role"
                      value={getRoleDisplayName(userData.role)}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      O perfil de acesso só pode ser alterado por um administrador
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Preferências do Sistema
                </CardTitle>
                <CardDescription>
                  Configure como você deseja usar o sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Tema</Label>
                    <Select
                      value={preferences.theme}
                      onValueChange={(value) => setPreferences(prev => ({ ...prev, theme: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Escuro</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="itemsPerPage">Itens por página</Label>
                    <Select
                      value={preferences.itemsPerPage.toString()}
                      onValueChange={(value) => setPreferences(prev => ({ ...prev, itemsPerPage: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Notificações</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications">Notificações do Sistema</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações sobre eventos importantes
                      </p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={preferences.notifications}
                      onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, notifications: checked }))}
                    />
                  </div>


                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSavePreferences} disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? "Salvando..." : "Salvar Preferências"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Segurança da Conta
                </CardTitle>
                <CardDescription>
                  Gerencie a segurança da sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Alterar Senha</h4>
                  
                  <div className="grid gap-4 md:grid-cols-1 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Senha Atual</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nova Senha</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleChangePassword} 
                    disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    {loading ? "Alterando..." : "Alterar Senha"}
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Informações da Conta</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Conta criada em:</span>
                      <span>{new Date(userData.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Último acesso:</span>
                      <span>{new Date(userData.lastLogin).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
         </Tabs>
        )}
       </div>
     </MainLayout>
   )
}