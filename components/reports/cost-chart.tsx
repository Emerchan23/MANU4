"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface CostChartProps {
  dateRange: string
  data?: any[]
  loading?: boolean
}

export function CostChart({ dateRange, data = [], loading = false }: CostChartProps) {
  // Garantir que data seja sempre um array e transformar os dados para o formato esperado pelo gráfico
  const safeData = Array.isArray(data) ? data : []
  
  // Transformar dados da API para o formato do gráfico
  let chartData = []
  
  // Se os dados vêm da API de cost-chart, usar periodCosts
  if (safeData.length > 0 && safeData[0].periodCosts) {
    chartData = safeData[0].periodCosts.map((item: any) => ({
      name: new Date(item.date).toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      }),
      real: item.cost || 0,
      estimado: (item.cost || 0) * 0.9, // Estimativa baseada no custo real
      ordens: item.orders || 0
    }))
  } else {
    // Formato direto de dados
    chartData = safeData.map((item: any) => ({
      name: item.name || item.date || 'Data',
      real: item.real || item.cost || 0,
      estimado: item.estimado || (item.cost || 0) * 0.9,
      ordens: item.ordens || item.orders || 0
    }))
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Custos</CardTitle>
          <CardDescription>Comparativo entre custos estimados e reais</CardDescription>
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
          <CardTitle>Evolução de Custos</CardTitle>
          <CardDescription>Comparativo entre custos estimados e reais</CardDescription>
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
        <CardTitle>Evolução de Custos</CardTitle>
        <CardDescription>Comparativo entre custos estimados e reais</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
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
                `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
                name === 'real' ? 'Custo Real' : 'Custo Estimado'
              ]}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="estimado"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              name="Estimado"
              dot={{ fill: "hsl(var(--chart-3))" }}
            />
            <Line
              type="monotone"
              dataKey="real"
              stroke="hsl(var(--chart-4))"
              strokeWidth={2}
              name="Real"
              dot={{ fill: "hsl(var(--chart-4))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
