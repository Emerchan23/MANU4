"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface SectorPerformanceChartProps {
  selectedSector: string
  data?: any[]
  loading?: boolean
}

export function SectorPerformanceChart({ selectedSector, data = [], loading = false }: SectorPerformanceChartProps) {
  // Garantir que data seja sempre um array e transformar os dados para o formato esperado pelo gráfico
  const safeData = Array.isArray(data) ? data : []
  
  // Transformar dados da API para o formato do gráfico
  const chartData = safeData.map(item => ({
    setor: item.sector_name || item.name || 'Setor',
    concluidas: item.completed_orders || 0,
    pendentes: (item.open_orders || 0) + (item.in_progress_orders || 0),
    total: item.total_orders || 0,
    taxa_conclusao: item.completion_rate || 0
  }))

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance por Setor</CardTitle>
          <CardDescription>Ordens concluídas vs pendentes por setor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance por Setor</CardTitle>
          <CardDescription>Ordens concluídas vs pendentes por setor</CardDescription>
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
        <CardTitle>Performance por Setor</CardTitle>
        <CardDescription>Ordens concluídas vs pendentes por setor</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-muted-foreground" />
            <YAxis dataKey="setor" type="category" className="text-muted-foreground" width={100} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
              formatter={(value, name) => [
                value,
                name === 'concluidas' ? 'Concluídas' : 'Pendentes'
              ]}
              labelFormatter={(label) => `Setor: ${label}`}
            />
            <Bar dataKey="concluidas" fill="hsl(var(--chart-1))" name="Concluídas" />
            <Bar dataKey="pendentes" fill="hsl(var(--chart-2))" name="Pendentes" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
