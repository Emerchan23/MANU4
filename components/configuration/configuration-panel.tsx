"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShieldExclamationIcon, CogIcon, CheckIcon } from "@heroicons/react/24/outline"
import { Info as InfoIcon } from "lucide-react"
import { toast } from "sonner"
// import { PermissionGuard } from "@/components/auth/permission-guard" // Authentication removed
// import { UserRoleSwitcher } from "@/components/auth/user-role-switcher" // Authentication removed
// import { getCurrentUser, getUserPermissions } from '@/lib/auth-client' // Authentication removed
import { BackupRestore } from "./backup-restore"
import { MaintenanceTypes } from "./maintenance-types"
import { NotificationSettings } from "./notification-settings"
import { CompanyDataSettings } from "./company-data"
import { SectorList } from "@/components/sectors/sector-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PersonalizationSettings } from "./personalization-settings"
import { UserManagement } from "@/components/users/user-management"
import { TemplateManager } from "@/components/templates/TemplateManager"
import PDFCustomization from "@/components/settings/pdf-customization"

export function ConfigurationPanel() {
  // const user = getCurrentUser() // Authentication removed
  const user = { name: "Usuário", role: "admin" } // Authentication removed - default user

  // const permissions = getUserPermissions(user) // Authentication removed
  const permissions = {
    canViewAllSectors: true,
    canManageUsers: true,
    canManageConfigurations: true,
    canManageEquipments: true,
    canCreateServiceOrders: true,
    canApproveServiceOrders: true,
    canViewReports: true
  } // Authentication removed - default permissions

  const [generalSettings, setGeneralSettings] = useState({
    maintenanceAlertDays: 7,
    calibrationAlertDays: 15,
    autoCheckInterval: 24,
    maintenanceMode: false,
    autoBackup: true,
    detailedLogs: false,
    itemsPerPage: 25,
    sessionTimeout: 30
  })

  const [lockedSettings, setLockedSettings] = useState<Record<string, boolean>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    loadGeneralSettings()
  }, [])

  const loadGeneralSettings = async () => {
    try {
      const response = await fetch('/api/system/general-config')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setGeneralSettings(prev => ({ ...prev, ...result.data }))
          if (result.locked) {
            setLockedSettings(result.locked)
          }
        } else {
          toast.error('Erro ao carregar configurações')
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast.error('Erro ao carregar configurações')
    }
  }

  const saveGeneralSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/system/general-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(generalSettings)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setLastSaved(new Date())
          toast.success('Configurações salvas com sucesso!')
        } else {
          toast.error(result.error || 'Erro ao salvar configurações')
        }
      } else {
        throw new Error('Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleLock = async (settingKey: string) => {
    try {
      const isCurrentlyLocked = lockedSettings[settingKey] || false
      const response = await fetch('/api/system/general-config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settingKey,
          isLocked: !isCurrentlyLocked
        })
      })

      if (response.ok) {
        setLockedSettings(prev => ({
          ...prev,
          [settingKey]: !isCurrentlyLocked
        }))
        toast.success(`Configuração ${!isCurrentlyLocked ? 'bloqueada' : 'desbloqueada'}`)
      } else {
        toast.error('Erro ao atualizar bloqueio')
      }
    } catch (error) {
      console.error('Erro ao atualizar bloqueio:', error)
      toast.error('Erro ao atualizar bloqueio')
    }
  }

  const updateSetting = (key: string, value: any) => {
    if (lockedSettings[key]) {
      toast.error('Esta configuração está bloqueada')
      return
    }
    setGeneralSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
      </div>

      {/* Authentication removed - direct access allowed */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-10">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="maintenance-types">Tipos Manutenção</TabsTrigger>
            <TabsTrigger value="sectors">Setores</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="company">Empresa</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="personalization">Personalização</TabsTrigger>
            <TabsTrigger value="pdf-settings">PDF</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CogIcon className="h-5 w-5" />
                  Configurações Gerais
                </CardTitle>
                <CardDescription>Parâmetros básicos do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Alertas e Prazos */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Alertas e Prazos</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="maintenanceAlertDays">Dias de antecedência para alertas de manutenção</Label>
                      <Input
                        id="maintenanceAlertDays"
                        type="number"
                        min="1"
                        max="365"
                        value={generalSettings.maintenanceAlertDays}
                        onChange={(e) => updateSetting('maintenanceAlertDays', parseInt(e.target.value) || 7)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="calibrationAlertDays">Dias de antecedência para alertas de calibração</Label>
                      <Input
                        id="calibrationAlertDays"
                        type="number"
                        min="1"
                        max="365"
                        value={generalSettings.calibrationAlertDays}
                        onChange={(e) => updateSetting('calibrationAlertDays', parseInt(e.target.value) || 15)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="autoCheckInterval">Intervalo de verificação automática (horas)</Label>
                      <Input
                        id="autoCheckInterval"
                        type="number"
                        min="1"
                        max="168"
                        value={generalSettings.autoCheckInterval}
                        onChange={(e) => updateSetting('autoCheckInterval', parseInt(e.target.value) || 24)}
                      />
                    </div>
                  </div>
                </div>

                {/* Configurações de Sistema */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Configurações de Sistema</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Modo de manutenção</Label>
                        <p className="text-sm text-muted-foreground">Ativar modo de manutenção do sistema</p>
                      </div>
                      <Switch
                        checked={generalSettings.maintenanceMode}
                        onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Backup automático</Label>
                        <p className="text-sm text-muted-foreground">Realizar backup automático dos dados</p>
                      </div>
                      <Switch
                        checked={generalSettings.autoBackup}
                        onCheckedChange={(checked) => updateSetting('autoBackup', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Logs detalhados</Label>
                        <p className="text-sm text-muted-foreground">Ativar logs detalhados do sistema</p>
                      </div>
                      <Switch
                        checked={generalSettings.detailedLogs}
                        onCheckedChange={(checked) => updateSetting('detailedLogs', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Configurações de Interface */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Configurações de Interface</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="itemsPerPage">Itens por página em listagens</Label>
                      <Select
                        value={generalSettings.itemsPerPage.toString()}
                        onValueChange={(value) => updateSetting('itemsPerPage', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 itens</SelectItem>
                          <SelectItem value="25">25 itens</SelectItem>
                          <SelectItem value="50">50 itens</SelectItem>
                          <SelectItem value="100">100 itens</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Timeout de sessão (minutos)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min="5"
                        max="480"
                        value={generalSettings.sessionTimeout}
                        onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value) || 30)}
                      />
                    </div>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {lastSaved && (
                      <>
                        <CheckIcon className="h-4 w-4 text-green-600" />
                        Salvo em {lastSaved.toLocaleString()}
                      </>
                    )}
                  </div>
                  <Button
                    onClick={saveGeneralSettings}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance-types" className="space-y-6">
            <MaintenanceTypes />
          </TabsContent>

          <TabsContent value="sectors" className="space-y-6">
            <SectorList />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <CompanyDataSettings />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <TemplateManager />
          </TabsContent>

          <TabsContent value="personalization" className="space-y-6">
            <PersonalizationSettings />
          </TabsContent>

          <TabsContent value="pdf-settings" className="space-y-6">
            <PDFCustomization />
          </TabsContent>

          <TabsContent value="backup" className="space-y-6">
            <BackupRestore />
          </TabsContent>
        </Tabs>
      {/* End of authentication removal */}

      {/* UserRoleSwitcher removed - authentication system removed */}
    </div>
  )
}
