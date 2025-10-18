"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface EquipmentStatusChartProps {
  data?: any[]
  loading?: boolean
}

export function EquipmentStatusChart({ data = [], loading = false }: EquipmentStatusChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status dos Equipamentos</CardTitle>
          <CardDescription>Distribuição atual do status dos equipamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Transformar dados da API para o formato do gráfico
  const safeData = Array.isArray(data) ? data : []
  let chartData = []

  // Se os dados vêm da API de equipment-status, usar statusSummary
  if (safeData.length > 0 && safeData[0].statusSummary) {
    chartData = safeData[0].statusSummary.map((item: any, index: number) => ({
      name: item.status === 'ativo' ? 'Ativo' : 
            item.status === 'inativo' ? 'Inativo' : 
            item.status === 'manutencao' ? 'Manutenção' : item.status,
      value: item.count,
      color: item.status === 'ativo' ? 'hsl(var(--chart-1))' :
             item.status === 'inativo' ? 'hsl(var(--chart-2))' :
             item.status === 'manutencao' ? 'hsl(var(--chart-3))' :
             `hsl(var(--chart-${(index % 4) + 1}))`
    }))
  } else {
    // Formato direto de dados
    chartData = safeData.map((item: any, index: number) => ({
      name: item.name || item.status || 'Status',
      value: item.value || item.count || 0,
      color: item.color || `hsl(var(--chart-${(index % 4) + 1}))`
    }))
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status dos Equipamentos</CardTitle>
          <CardDescription>Distribuição atual do status dos equipamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">Nenhum dado disponível</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status dos Equipamentos</CardTitle>
        <CardDescription>Distribuição atual do status dos equipamentos</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
