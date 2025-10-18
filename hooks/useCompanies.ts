import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export interface Company {
  id: number
  name: string
  cnpj?: string
  address?: string
  contact_person?: string
  phone?: string
  email?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/companies', {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar empresas')
      }

      const data = await response.json()
      setCompanies(data)
    } catch (err) {
      console.error('Erro ao buscar empresas:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      toast.error('Erro ao carregar empresas')
    } finally {
      setLoading(false)
    }
  }

  const createCompany = async (companyData: {
    name: string
    cnpj?: string
    address?: string
    contact_person?: string
    phone?: string
    email?: string
  }) => {
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(companyData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar empresa')
      }

      const newCompany = await response.json()
      toast.success('Empresa criada com sucesso!')
      await fetchCompanies() // Recarregar lista
      return newCompany
    } catch (error) {
      console.error('Erro ao criar empresa:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar empresa')
      throw error
    }
  }

  const updateCompany = async (id: number, companyData: {
    name?: string
    cnpj?: string
    address?: string
    contact_person?: string
    phone?: string
    email?: string
    status?: 'active' | 'inactive'
  }) => {
    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(companyData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar empresa')
      }

      const updatedCompany = await response.json()
      toast.success('Empresa atualizada com sucesso!')
      await fetchCompanies() // Recarregar lista
      return updatedCompany
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar empresa')
      throw error
    }
  }

  const deleteCompany = async (id: number) => {
    try {
      const response = await fetch(`/api/companies/${id}`, {
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
          toast.error(`Não é possível excluir a empresa. Existem ${dependencyCount} registros vinculados.`, {
            action: {
              label: 'Ver Dependências',
              onClick: () => window.open(`/validacao/dependencias/companies/${id}`, '_blank')
            }
          })
          return false
        }
        
        throw new Error(errorData.error || 'Erro ao excluir empresa')
      }

      toast.success('Empresa excluída com sucesso!')
      await fetchCompanies() // Recarregar lista
      return true
    } catch (error) {
      console.error('Erro ao excluir empresa:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir empresa')
      return false
    }
  }

  const deactivateCompany = async (id: number) => {
    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'inactive' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao desativar empresa')
      }

      toast.success('Empresa desativada com sucesso!')
      await fetchCompanies() // Recarregar lista
      return true
    } catch (error) {
      console.error('Erro ao desativar empresa:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao desativar empresa')
      return false
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  return {
    companies,
    loading,
    error,
    refetch: fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    deactivateCompany
  }
}