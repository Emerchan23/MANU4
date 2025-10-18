import { useState, useEffect } from 'react'
import { toast } from 'sonner'
// import { getCurrentUser } from '@/lib/auth-client' // Authentication removed
import type { SectorWithSubsectors } from '@/types/sectors'

export function useSectors() {
  const [sectors, setSectors] = useState<SectorWithSubsectors[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSectors = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Authentication removed - allow access without user

      // Buscar setores
      const sectorsResponse = await fetch('/api/sectors', {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!sectorsResponse.ok) {
        throw new Error('Erro ao buscar setores')
      }

      const sectorsData = await sectorsResponse.json()
      
      // Buscar subsetores
      const subsectorsResponse = await fetch('/api/subsectors', {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!subsectorsResponse.ok) {
        throw new Error('Erro ao buscar subsetores')
      }

      const subsectorsData = await subsectorsResponse.json()
      
      // Combinar setores com seus subsetores
      const sectorsWithSubsectors: SectorWithSubsectors[] = sectorsData.map((sector: any) => ({
        id: sector.id.toString(),
        name: sector.name,
        description: sector.description || '',
        responsible: sector.manager_id || '',
        subsectors: subsectorsData
          .filter((sub: any) => sub.sector_id.toString() === sector.id.toString())
          .map((sub: any) => ({
            id: sub.id.toString(),
            name: sub.name,
            description: sub.description || '',
            sectorId: sub.sector_id.toString()
          })),
        createdAt: new Date(sector.created_at),
        updatedAt: new Date(sector.updated_at)
      }))
      
      setSectors(sectorsWithSubsectors)
    } catch (err) {
      console.error('Erro ao buscar setores:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      toast.error('Erro ao carregar setores')
    } finally {
      setLoading(false)
    }
  }

  const createSector = async (sectorData: {
    name: string
    description?: string
    manager_id?: number
  }) => {
    try {
      const response = await fetch('/api/sectors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(sectorData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar setor')
      }

      const newSector = await response.json()
      toast.success('Setor criado com sucesso!')
      await fetchSectors() // Recarregar lista
      return newSector
    } catch (error) {
      console.error('Erro ao criar setor:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar setor')
      throw error
    }
  }

  const updateSector = async (id: string, sectorData: {
    name?: string
    description?: string
    manager_id?: number
  }) => {
    try {
      const response = await fetch(`/api/sectors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(sectorData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar setor')
      }

      const updatedSector = await response.json()
      toast.success('Setor atualizado com sucesso!')
      await fetchSectors() // Recarregar lista
      return updatedSector
    } catch (error) {
      console.error('Erro ao atualizar setor:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar setor')
      throw error
    }
  }

  const deleteSector = async (id: string) => {
    try {
      const response = await fetch(`/api/sectors/${id}`, {
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
          toast.error(`Não é possível excluir o setor. Existem ${dependencyCount} registros vinculados.`, {
            action: {
              label: 'Ver Dependências',
              onClick: () => window.open(`/validacao/dependencias/sectors/${id}`, '_blank')
            }
          })
          return false
        }
        
        throw new Error(errorData.error || 'Erro ao excluir setor')
      }

      toast.success('Setor excluído com sucesso!')
      await fetchSectors() // Recarregar lista
      return true
    } catch (error) {
      console.error('Erro ao excluir setor:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir setor')
      return false
    }
  }

  useEffect(() => {
    fetchSectors()
  }, [])

  return {
    sectors,
    loading,
    error,
    refetch: fetchSectors,
    createSector,
    updateSector,
    deleteSector
  }
}