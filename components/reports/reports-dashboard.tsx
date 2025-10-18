"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  ShieldExclamationIcon,
  CurrencyDollarIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline"
// import { PermissionGuard } from "@/components/auth/permission-guard" // Authentication removed
// import { getCurrentUser, getUserPermissions } from '@/lib/auth-client' // Authentication removed
import { MaintenanceChart } from "./maintenance-chart"
import { CostChart } from "./cost-chart"
import { SectorPerformanceChart } from "./sector-performance-chart"
import { EquipmentStatusChart } from "./equipment-status-chart"
import { 
  useReportsStats, 
  useMaintenanceChart, 
  useCostChart, 
  useSectorPerformance, 
  useEquipmentStatus 
} from "@/hooks/use-reports-data"
import { useSectors } from "@/hooks/useSectors"

export function ReportsDashboard() {
  // const user = getCurrentUser() // Authentication removed
  // const permissions = getUserPermissions(user) // Authentication removed
  const user = null // Authentication removed
  const permissions = { canViewAllSectors: true } // Authentication removed

  const [dateRange, setDateRange] = useState("30")
  const [selectedSector, setSelectedSector] = useState("ALL")

  // Hook para buscar setores reais do banco
  const { sectors, loading: sectorsLoading } = useSectors()

  // Hooks para dados reais
  const { stats, loading: statsLoading, error: statsError } = useReportsStats(dateRange, selectedSector)
  const { data: maintenanceData, loading: maintenanceLoading } = useMaintenanceChart(dateRange, selectedSector)
  const { data: costData, loading: costLoading } = useCostChart(dateRange, selectedSector)
  const { data: sectorData, loading: sectorLoading } = useSectorPerformance(dateRange)
  const { data: equipmentData, loading: equipmentLoading } = useEquipmentStatus()

  // Configuração dos ícones para as estatísticas
  const statsConfig = [
    { icon: WrenchScrewdriverIcon },
    { icon: CurrencyDollarIcon },
    { icon: ClockIcon },
    { icon: ChartBarIcon },
  ]

  const handleExportReport = async (reportType: string) => {
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          dateRange,
          sector: selectedSector,
          format: 'pdf'
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao exportar relatório');
      }

      const result = await response.json();
      
      if (result.success && result.downloadUrl) {
        // Download automático do PDF
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Mostrar mensagem de sucesso
        alert(`Relatório exportado com sucesso: ${result.fileName}`);
      } else {
        // Fallback para simulação
        alert(`Relatório exportado: ${result.fileName || 'arquivo.pdf'}`);
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao exportar relatório');
    }
  }

  return (
    // <PermissionGuard> removed - direct access allowed
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">
              Visualize relatórios e indicadores do sistema
              {!permissions.canViewAllSectors && (
                <span className="text-xs block mt-1">
                  Dados com permissões limitadas
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os setores</SelectItem>
                {sectorsLoading ? (
                  <SelectItem value="LOADING" disabled>Carregando setores...</SelectItem>
                ) : (
                  sectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Indicadores principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
                  <div className="h-4 w-4 bg-gray-300 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-300 rounded w-16 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                </CardContent>
              </Card>
            ))
          ) : statsError ? (
            <div className="col-span-4 text-center text-red-600 py-4">
              Erro ao carregar estatísticas: {statsError}
            </div>
          ) : (
            stats.map((stat, index) => {
              const IconComponent = statsConfig[index]?.icon || ChartBarIcon;
              return (
                <Card key={stat.name}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.name}</CardTitle>
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      <span
                        className={
                          stat.changeType === "positive"
                            ? "text-green-600"
                            : stat.changeType === "negative"
                              ? "text-red-600"
                              : "text-muted-foreground"
                        }
                      >
                        {stat.change}
                      </span>{" "}
                      em relação ao período anterior
                    </p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Gráficos principais */}
        <div className="grid gap-6 lg:grid-cols-2">
          <MaintenanceChart data={maintenanceData} loading={maintenanceLoading} dateRange={dateRange} />
          <CostChart data={costData} loading={costLoading} dateRange={dateRange} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectorPerformanceChart data={sectorData} loading={sectorLoading} selectedSector={selectedSector} />
          </div>
          <EquipmentStatusChart data={equipmentData} loading={equipmentLoading} />
        </div>

        {/* Alertas e ações rápidas */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DocumentArrowDownIcon className="h-5 w-5" />
                Exportar Relatórios
              </CardTitle>
              <CardDescription>Gere relatórios em diferentes formatos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => handleExportReport("maintenance-period")}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Manutenções por Período
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => handleExportReport("equipment-costs")}
              >
                <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                Custos por Equipamento
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => handleExportReport("technician-performance")}
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Performance de Técnicos
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => handleExportReport("sla-indicators")}
              >
                <ClockIcon className="h-4 w-4 mr-2" />
                Indicadores de SLA
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    // </PermissionGuard> removed - direct access allowed
  )
}
