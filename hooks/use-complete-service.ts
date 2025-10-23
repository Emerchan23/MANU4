'use client'

import { useState } from 'react'

interface UseCompleteServiceReturn {
  isCompleting: boolean
  completeService: (orderId: number) => Promise<void>
  error: string | null
}

export function useCompleteService(): UseCompleteServiceReturn {
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const completeService = async (orderId: number): Promise<void> => {
    setIsCompleting(true)
    setError(null)

    console.log('🔄 Iniciando conclusão da ordem:', orderId)

    try {
      const response = await fetch(`/api/service-orders/update/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CONCLUIDA',
          completionDate: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
        }),
      })

      console.log('📡 Resposta da API:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Erro da API:', errorData)
        throw new Error(errorData.error || errorData.message || 'Erro ao concluir ordem de serviço')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao concluir ordem de serviço')
      }

      console.log('✅ Ordem concluída com sucesso:', data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('❌ Erro ao concluir ordem:', err)
      throw err
    } finally {
      setIsCompleting(false)
    }
  }

  return {
    isCompleting,
    completeService,
    error,
  }
}