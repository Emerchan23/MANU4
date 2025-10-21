'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from "@/components/layout/main-layout"
import { ConfigurationPanel } from "@/components/configuration/configuration-panel"
import { useAuth } from "@/hooks/useAuth"

export default function ConfigurationPage() {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }
      
      if (!isAdmin) {
        router.push('/dashboard')
        return
      }
    }
  }, [isAuthenticated, isAdmin, loading, router])

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verificando permissões...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Não renderizar nada se não estiver autenticado ou não for admin
  if (!isAuthenticated || !isAdmin) {
    return null
  }

  return (
    <MainLayout>
      <ConfigurationPanel />
    </MainLayout>
  )
}
