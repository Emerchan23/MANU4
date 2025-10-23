'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { MetricCard } from '@/src/components/dashboard/MetricCard';

import { CalendarWidget } from '@/src/components/dashboard/CalendarWidget';
import { OperationalCharts } from '@/src/components/dashboard/OperationalCharts';
import { useDashboardMetrics } from '@/src/hooks/useDashboardMetrics';
import { useCalendarEvents } from '@/src/hooks/useCalendarEvents';


export default function Dashboard() {
  const { data: metricsData, loading: metricsLoading } = useDashboardMetrics();
  const { data: calendarData, loading: calendarLoading } = useCalendarEvents();


  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard Principal
          </h1>
          <p className="text-gray-600">
            Visão geral do sistema de manutenção hospitalar
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Equipamentos Ativos"
            value={metricsData?.metrics?.activeEquipment || metricsData?.metrics?.equipmentsActive || 0}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            color="blue"
            loading={metricsLoading}
          />
          
          <MetricCard
            title="Manutenções Pendentes"
            value={metricsData?.metrics?.pendingMaintenances || 0}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="yellow"
            loading={metricsLoading}
          />
          
          
          <MetricCard
            title="Ordens de Serviço"
            value={metricsData?.metrics?.openServiceOrders || 0}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            color="green"
            loading={metricsLoading}
          />
        </div>

        {/* Calendar Widget - Full Width */}
        <div>
          <CalendarWidget
            events={calendarData?.events || []}
            loading={calendarLoading}
          />
        </div>

        {/* Operational Charts */}
        <div className="mt-8">
          <OperationalCharts
            monthlyStats={metricsData?.charts?.monthlyStats || []}
            costAnalysis={metricsData?.charts?.costAnalysis || []}
            companyPerformance={metricsData?.charts?.companyPerformance || []}
            loading={metricsLoading}
          />
        </div>
      </div>
    </MainLayout>
  );
}
