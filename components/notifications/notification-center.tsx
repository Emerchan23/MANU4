"use client"

import { Card, CardContent } from "@/components/ui/card"
import { BellIcon } from "@heroicons/react/24/outline"

export function NotificationCenter() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Central de Notificações</h1>
        <p className="text-muted-foreground">Gerencie suas notificações do sistema</p>
      </div>

      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <BellIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Nenhuma notificação</h3>
            <p className="text-sm text-muted-foreground">Sistema simplificado - notificações desabilitadas</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
