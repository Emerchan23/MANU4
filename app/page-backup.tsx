"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Sistema de Manutenção Hospitalar</h1>
          <p className="text-muted-foreground">
            Sistema integrado de gestão de equipamentos médicos
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Bem-vindo ao Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Sistema Ativo</div>
              <p className="text-xs text-muted-foreground">
                Acesse as funcionalidades através do menu lateral
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}