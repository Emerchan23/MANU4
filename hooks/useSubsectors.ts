import { useState, useEffect } from 'react'
import { toast } from 'sonner'
// import { getCurrentUser } from '@/lib/auth-client' // Authentication removed

export interface Subsector {
  id: number
  name: string
  description?: string
  sector_id: number
  sector_name?: string
}

export function useSubsectors() {
  const [subsectors, setSubsectors] = useState<Subsector[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubsectors = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/subsectors', {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro ao buscar subsetores: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      if (Array.isArray(data)) {
        setSubsectors(data)
        console.log('Subsectors loaded:', data.length)
      } else {
        console.error('Invalid subsectors data format:', data)
        setSubsectors([])
      }
    } catch (err) {
      console.error('Error fetching subsectors:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      toast.error('Erro ao carregar subsetores')
      setSubsectors([])
    } finally {
      setLoading(false)
    }
  }

  const createSubsector = async (subsectorData: {
    name: string
    description?: string
    sector_id: number
  }) => {
    try {
      const response = await fetch('/api/subsectors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(subsectorData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar subsetor')
      }

      const newSubsector = await response.json()
      toast.success('Subsetor criado com sucesso!')
      await fetchSubsectors() // Recarregar lista
      return newSubsector
    } catch (error) {
      console.error('Erro ao criar subsetor:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar subsetor')
      throw error
    }
  }

  const updateSubsector = async (id: number, subsectorData: {
    name?: string
    description?: string
    sector_id?: number
  }) => {
    try {
      const response = await fetch(`/api/subsectors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(subsectorData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar subsetor')
      }

      const updatedSubsector = await response.json()
      toast.success('Subsetor atualizado com sucesso!')
      await fetchSubsectors() // Recarregar lista
      return updatedSubsector
    } catch (error) {
      console.error('Erro ao atualizar subsetor:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar subsetor')
      throw error
    }
  }

  const deleteSubsector = async (id: number) => {
    try {
      const response = await fetch(`/api/subsectors/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle referential integrity conflicts
        if (response.status === 409) {
          const dependencyCount = errorData.dependencyCount || 0
          toast.error(`Não é possível excluir o subsetor. Existem ${dependencyCount} registros vinculados.`, {
            action: {
              label: 'Ver Dependências',
              onClick: () => window.open(`/validacao/dependencias/subsectors/${id}`, '_blank')
            }
          })
          return false
        }
        
        throw new Error(errorData.error || 'Erro ao excluir subsetor')
      }

      toast.success('Subsetor excluído com sucesso!')
      await fetchSubsectors() // Recarregar lista
      return true
    } catch (error) {
      console.error('Erro ao excluir subsetor:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir subsetor')
      return false
    }
  }

  useEffect(() => {
    fetchSubsectors()
  }, [])

  return {
    subsectors,
    loading,
    error,
    refetch: fetchSubsectors,
    createSubsector,
    updateSubsector,
    deleteSubsector
  }
}