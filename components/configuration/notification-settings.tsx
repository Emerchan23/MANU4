"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { BellIcon, CheckCircleIcon } from "@heroicons/react/24/outline"

interface NotificationConfig {
  pushEnabled: boolean
  maintenanceAlerts: boolean
  criticalEquipmentAlerts: boolean
  overdueMaintenanceAlerts: boolean
  calibrationReminders: boolean
  systemAlerts: boolean
}

export function NotificationSettings() {
  const [config, setConfig] = useState<NotificationConfig>({
    pushEnabled: true,
    maintenanceAlerts: true,
    criticalEquipmentAlerts: true,
    overdueMaintenanceAlerts: true,
    calibrationReminders: true,
    systemAlerts: false
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  // Carregar configurações salvas
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/notification-settings')
        if (response.ok) {
          const data = await response.json()
          setConfig(data)
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
      }
    }
    loadConfig()
  }, [])

  const handleConfigChange = (key: keyof NotificationConfig, value: boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const saveConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notification-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: config })
      })

      if (response.ok) {
        setSaved(true)
        toast.success('Configurações salvas com sucesso!')
        setTimeout(() => setSaved(false), 3000)
      } else {
        throw new Error('Erro ao salvar configurações')
      }
    } catch (error) {
      toast.error('Erro ao salvar configurações')
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Configurações de Notificação</h2>
        <p className="text-muted-foreground">Configure as notificações push do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellIcon className="h-5 w-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>Gerencie as notificações que você deseja receber</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controle principal */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Ativar Notificações Push</Label>
              <p className="text-sm text-muted-foreground">Receber notificações do sistema no navegador</p>
            </div>
            <Switch
              checked={config.pushEnabled}
              onCheckedChange={(checked) => handleConfigChange('pushEnabled', checked)}
            />
          </div>

          {config.pushEnabled && (
            <>
              <div className="border-t pt-4 space-y-4">
                <h4 className="font-medium">Tipos de Notificação</h4>
                
                {/* Alertas de Manutenção */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Alertas de Manutenção</Label>
                    <p className="text-sm text-muted-foreground">Notificações sobre manutenções programadas</p>
                  </div>
                  <Switch
                    checked={config.maintenanceAlerts}
                    onCheckedChange={(checked) => handleConfigChange('maintenanceAlerts', checked)}
                  />
                </div>

                {/* Equipamentos Críticos */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Equipamentos Críticos</Label>
                    <p className="text-sm text-muted-foreground">Alertas sobre equipamentos em estado crítico</p>
                  </div>
                  <Switch
                    checked={config.criticalEquipmentAlerts}
                    onCheckedChange={(checked) => handleConfigChange('criticalEquipmentAlerts', checked)}
                  />
                </div>

                {/* Manutenções Vencidas */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Manutenções Vencidas</Label>
                    <p className="text-sm text-muted-foreground">Notificações sobre manutenções em atraso</p>
                  </div>
                  <Switch
                    checked={config.overdueMaintenanceAlerts}
                    onCheckedChange={(checked) => handleConfigChange('overdueMaintenanceAlerts', checked)}
                  />
                </div>

                {/* Lembretes de Calibração */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Lembretes de Calibração</Label>
                    <p className="text-sm text-muted-foreground">Notificações sobre calibrações próximas do vencimento</p>
                  </div>
                  <Switch
                    checked={config.calibrationReminders}
                    onCheckedChange={(checked) => handleConfigChange('calibrationReminders', checked)}
                  />
                </div>

                {/* Alertas do Sistema */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Alertas do Sistema</Label>
                    <p className="text-sm text-muted-foreground">Notificações sobre atualizações e manutenção do sistema</p>
                  </div>
                  <Switch
                    checked={config.systemAlerts}
                    onCheckedChange={(checked) => handleConfigChange('systemAlerts', checked)}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <Button 
                  onClick={saveConfig} 
                  disabled={loading || saved}
                  className="w-full"
                >
                  {loading ? (
                    "Salvando..."
                  ) : saved ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Configurações Salvas
                    </>
                  ) : (
                    "Salvar Configurações"
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
