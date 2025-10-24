import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface OperationalChartsProps {
  monthlyStats: any[];
  costAnalysis: any[];
  companyPerformance: any[];
  loading?: boolean;
}

const COLORS = ['#2563EB', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6'];

export function OperationalCharts({
  monthlyStats,
  costAnalysis,
  companyPerformance,
  loading = false,
}: OperationalChartsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Transform monthly stats for chart
  const monthlyChartData = (monthlyStats || []).map(stat => ({
    month: stat.month,
    Agendadas: stat.total_scheduled,
    Concluídas: stat.completed,
    Atrasadas: stat.overdue,
    Pendentes: stat.pending,
  }));

  // Transform cost analysis for pie chart
  const costChartData = (costAnalysis || []).map(item => ({
    name: item.sector_name,
    value: parseFloat(item.total_estimated_cost) || 0,
    count: parseInt(item.total_service_orders) || 0,
    equipments: parseInt(item.total_equipments) || 0,
  }));

  // Transform company performance for bar chart
  const performanceChartData = (companyPerformance || []).map(company => ({
    name: company.company_name,
    'Taxa de Conclusão': parseFloat(company.completion_rate) || 0,
    'Total de Agendamentos': parseInt(company.total_schedules) || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Monthly Statistics Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Estatísticas Mensais de Manutenção
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="Agendadas"
              stroke="#2563EB"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="Concluídas"
              stroke="#10B981"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="Atrasadas"
              stroke="#EF4444"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Analysis by Sector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Análise de Custos por Setor
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={costChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {costChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [
                  new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(value),
                  'Custo Total',
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Company Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance por Empresa
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis 
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'Taxa de Conclusão') {
                    return [`${value.toFixed(1)}%`, name];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Bar 
                dataKey="Taxa de Conclusão" 
                fill="#10B981"
                minPointSize={2}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Resumo Operacional
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {(monthlyStats || []).reduce((acc, stat) => acc + stat.total_scheduled, 0)}
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-300">Total Agendado (6 meses)</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format((monthlyStats || []).reduce((acc, stat) => acc + (parseFloat(stat.completed_cost) || 0), 0))}
            </div>
            <div className="text-sm text-green-800 dark:text-green-300">Total Concluído</div>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format((monthlyStats || []).reduce((acc, stat) => acc + (parseFloat(stat.overdue_cost) || 0), 0))}
            </div>
            <div className="text-sm text-red-800 dark:text-red-300">Total em Atraso</div>
          </div>
        </div>
      </div>
    </div>
  );
}