"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  WrenchScrewdriverIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline"
// import { getCurrentUser, getUserPermissions } from '@/lib/auth-client' // Authentication removed
import { useDashboardStats, usePriorityAlerts } from '@/hooks/use-dashboard-data'
import Link from "next/link"

export function DashboardOverview() {
  // const user = getCurrentUser() // Authentication removed
  // const permissions = getUserPermissions(user) // Authentication removed
  const user = null // Authentication removed
  const permissions = {} // Authentication removed
  const { stats, loading: statsLoading, error: statsError } = useDashboardStats()
  const { orders, loading: ordersLoading, error: ordersError } = useRecentOrders()
  const { alerts, loading: alertsLoading, error: alertsError } = usePriorityAlerts()

  const statsConfig = [
    {
      name: "Total de Equipamentos",
      key: "totalEquipment" as const,
      icon: WrenchScrewdriverIcon,
    },
    {
      name: "Ordens Abertas",
      key: "openOrders" as const,
      icon: ClipboardDocumentListIcon,
    },
    {
      name: "Alertas Ativos",
      key: "activeAlerts" as const,
      icon: ExclamationTriangleIcon,
    },
    {
      name: "Concluídas Hoje",
      key: "completedToday" as const,
      icon: CheckCircleIcon,
    },
  ]

  if (statsError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Erro ao carregar dados do dashboard: {statsError}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de manutenção hospitalar
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {user?.profile} - {user?.name}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsConfig.map((statConfig) => {
          const statData = stats?.[statConfig.key]
          return (
            <Card key={statConfig.name} className="dark:border-black">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {statConfig.name}
                </CardTitle>
                <statConfig.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {statsLoading ? "..." : statData?.value || "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span
                    className={
                      statData?.changeType === "positive"
                        ? "text-green-600"
                        : statData?.changeType === "negative"
                          ? "text-red-600"
                          : "text-muted-foreground"
                    }
                  >
                    {statsLoading ? "..." : statData?.change || "0%"}
                  </span>{" "}
                  em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Card de Ordens Recentes removido: funcionalidade descontinuada */}

        <Card className="col-span-3 dark:border-black">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Alertas Prioritários</CardTitle>
              <CardDescription>Equipamentos que requerem atenção imediata</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/alertas">
                Ver todos
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4 animate-pulse">
                    <div className="w-2 h-2 bg-gray-300 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : alertsError ? (
              <div className="text-center text-red-600 py-4">
                Erro ao carregar alertas: {alertsError}
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                Nenhum alerta prioritário no momento
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-center space-x-4">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        alert.priority === "Alta" ? "bg-red-500" : 
                        alert.priority === "Média" ? "bg-yellow-500" : 
                        "bg-green-500"
                      }`}
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-foreground">{alert.equipment}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.sector} - Prioridade {alert.priority}
                        {alert.daysUntil <= 0 ? " (Vencido)" : ` (${alert.daysUntil} dias)`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {permissions.relatorios && (
        <Card>
          <CardHeader>
            <CardTitle>Acesso Rápido</CardTitle>
            <CardDescription>Links para as principais funcionalidades do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="justify-start bg-transparent" asChild>
                <Link href="/equipamentos">
                  <WrenchScrewdriverIcon className="h-4 w-4 mr-2" />
                  Gerenciar Equipamentos
                </Link>
              </Button>
              <Button variant="outline" className="justify-start bg-transparent" asChild>
                <Link href="/ordens-servico">
                  <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                  Ordens de Serviço
                </Link>
              </Button>
              <Button variant="outline" className="justify-start bg-transparent" asChild>
                <Link href="/relatorios">
                  <ArrowRightIcon className="h-4 w-4 mr-2" />
                  Ver Relatórios
                </Link>
              </Button>
              <Button variant="outline" className="justify-start bg-transparent" asChild>
                <Link href="/setores">
                  <ArrowRightIcon className="h-4 w-4 mr-2" />
                  Gerenciar Setores
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
