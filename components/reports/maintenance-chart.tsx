"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface MaintenanceChartProps {
  dateRange: string
  data?: any[]
  loading?: boolean
}

export function MaintenanceChart({ dateRange, data = [], loading = false }: MaintenanceChartProps) {
  // Garantir que data seja sempre um array e transformar os dados para o formato esperado pelo gráfico
  const safeData = Array.isArray(data) ? data : []
  
  // Transformar dados da API para o formato do gráfico
  const chartData = safeData.map((item: any) => {
    const date = item.date ? new Date(item.date).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    }) : item.name || 'Data'
    
    return {
      name: date,
      preventiva: item.type === 'preventiva' ? item.count : 0,
      corretiva: item.type === 'corretiva' ? item.count : 0,
      total: item.count || 0
    }
  })

  // Agrupar dados por data se necessário
  const groupedData = chartData.reduce((acc: any[], curr: any) => {
    const existing = acc.find(item => item.name === curr.name)
    if (existing) {
      existing.preventiva += curr.preventiva
      existing.corretiva += curr.corretiva
      existing.total += curr.total
    } else {
      acc.push(curr)
    }
    return acc
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manutenções por Período</CardTitle>
          <CardDescription>Comparativo entre manutenções preventivas e corretivas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!groupedData || groupedData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manutenções por Período</CardTitle>
          <CardDescription>Comparativo entre manutenções preventivas e corretivas</CardDescription>
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
        <CardTitle>Manutenções por Período</CardTitle>
        <CardDescription>Comparativo entre manutenções preventivas e corretivas</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={groupedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-muted-foreground" />
            <YAxis className="text-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
              formatter={(value: number, name: string) => [
                value,
                name === 'preventiva' ? 'Manutenção Preventiva' : 'Manutenção Corretiva'
              ]}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Legend />
            <Bar dataKey="preventiva" fill="hsl(var(--chart-1))" name="Preventiva" />
            <Bar dataKey="corretiva" fill="hsl(var(--chart-2))" name="Corretiva" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
