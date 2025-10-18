"use client"

import { MainLayout } from "@/components/layout/main-layout"
import DashboardLayout from "@/components/dashboard/DashboardLayout"

export default function DashboardPage() {
  return (
    <MainLayout>
      <DashboardLayout 
        title="Dashboard de Manutenção Hospitalar"
        subtitle="Sistema integrado de gestão de equipamentos médicos"
        showControls={true}
        refreshInterval={30000}
      />
    </MainLayout>
  )
}