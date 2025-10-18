import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface TemplateCategory {
  id: number
  name: string
  description: string | null
  color: string
  active: boolean
  created_at: string
  updated_at: string
  template_count?: number
}

export interface TemplateCategoryFilters {
  search?: string
  active?: boolean
  page?: number
  limit?: number
}

export interface TemplateCategoryPagination {
  currentPage: number
  totalPages: number
  totalRecords: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface TemplateCategoryResponse {
  success: boolean
  data: TemplateCategory[]
  pagination: TemplateCategoryPagination
}

export interface CreateTemplateCategoryData {
  name: string
  description?: string
  color?: string
  active?: boolean
}

export interface UpdateTemplateCategoryData extends Partial<CreateTemplateCategoryData> {
  id: number
}

export function useTemplateCategories() {
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<TemplateCategoryPagination>({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 50,
    hasNextPage: false,
    hasPrevPage: false
  })
  const [filters, setFilters] = useState<TemplateCategoryFilters>({
    page: 1,
    limit: 50
  })

  // Buscar categorias
  const fetchCategories = useCallback(async (newFilters?: TemplateCategoryFilters) => {
    try {
      setLoading(true)
      
      const currentFilters = newFilters ? { ...filters, ...newFilters } : filters
      if (newFilters) {
        setFilters(currentFilters)
      }

      const params = new URLSearchParams()
      
      if (currentFilters.search) params.append('search', currentFilters.search)
      if (currentFilters.active !== undefined) params.append('active', currentFilters.active.toString())
      if (currentFilters.page) params.append('page', currentFilters.page.toString())
      if (currentFilters.limit) params.append('limit', currentFilters.limit.toString())

      const response = await fetch(`/api/template-categories?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar categorias')
      }

      const data: TemplateCategoryResponse = await response.json()
      
      if (data.success) {
        setCategories(data.data)
        setPagination(data.pagination)
      } else {
        throw new Error('Erro na resposta da API')
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
      toast.error('Erro ao carregar categorias')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Criar categoria
  const createCategory = useCallback(async (data: CreateTemplateCategoryData): Promise<TemplateCategory | null> => {
    try {
      const response = await fetch('/api/template-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar categoria')
      }

      const newCategory: TemplateCategory = await response.json()
      
      // Atualizar lista local
      setCategories(prev => [newCategory, ...prev])
      
      toast.success('Categoria criada com sucesso!')
      return newCategory
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar categoria')
      return null
    }
  }, [])

  // Atualizar categoria
  const updateCategory = useCallback(async (data: UpdateTemplateCategoryData): Promise<TemplateCategory | null> => {
    try {
      const response = await fetch('/api/template-categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar categoria')
      }

      const updatedCategory: TemplateCategory = await response.json()
      
      // Atualizar lista local
      setCategories(prev => 
        prev.map(category => 
          category.id === updatedCategory.id ? updatedCategory : category
        )
      )
      
      toast.success('Categoria atualizada com sucesso!')
      return updatedCategory
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar categoria')
      return null
    }
  }, [])

  // Excluir categoria
  const deleteCategory = useCallback(async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/template-categories?id=${id}`, {
        method: 'DELETE',
      })

      const responseData = await response.json()

      if (!response.ok) {
        // Se for erro 409 (conflito), mostrar mensagem específica com opção de ver templates
        if (response.status === 409 && responseData.templateCount) {
          toast.error(
            `Não é possível excluir a categoria. Existem ${responseData.templateCount} template${responseData.templateCount > 1 ? 's' : ''} vinculado${responseData.templateCount > 1 ? 's' : ''} a esta categoria.`,
            {
              duration: 6000,
              action: {
                label: 'Ver Templates',
                onClick: () => {
                  // Navegar para a aba de templates com filtro da categoria
                  window.location.hash = '#templates'
                  // Trigger um evento customizado para filtrar por categoria
                  window.dispatchEvent(new CustomEvent('filterByCategory', { detail: { categoryId: id } }))
                }
              }
            }
          )
        } else {
          throw new Error(responseData.error || 'Erro ao excluir categoria')
        }
        return false
      }

      // Remover da lista local
      setCategories(prev => prev.filter(category => category.id !== id))
      
      toast.success('Categoria excluída com sucesso!')
      return true
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir categoria')
      return false
    }
  }, [])

  // Buscar categoria por ID
  const getCategoryById = useCallback(async (id: number): Promise<TemplateCategory | null> => {
    try {
      // Primeiro verificar se já temos a categoria na lista local
      const localCategory = categories.find(c => c.id === id)
      if (localCategory) {
        return localCategory
      }

      // Se não encontrar localmente, buscar na API
      const response = await fetch(`/api/template-categories?id=${id}`)
      
      if (!response.ok) {
        throw new Error('Categoria não encontrada')
      }

      const category: TemplateCategory = await response.json()
      return category
    } catch (error) {
      console.error('Erro ao buscar categoria:', error)
      return null
    }
  }, [categories])

  // Buscar categorias ativas (para seletores)
  const fetchActiveCategories = useCallback(async (): Promise<TemplateCategory[]> => {
    try {
      const params = new URLSearchParams({
        active: 'true',
        limit: '100' // Buscar todas as categorias ativas
      })

      const response = await fetch(`/api/template-categories?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar categorias ativas')
      }

      const data: TemplateCategoryResponse = await response.json()
      
      if (data.success) {
        return data.data
      } else {
        throw new Error('Erro na resposta da API')
      }
    } catch (error) {
      console.error('Erro ao buscar categorias ativas:', error)
      return []
    }
  }, [])

  // Cores predefinidas para categorias
  const predefinedColors = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#EC4899', // Pink
    '#6366F1', // Indigo
  ]

  // Obter próxima cor disponível
  const getNextAvailableColor = useCallback((): string => {
    const usedColors = categories.map(cat => cat.color)
    const availableColor = predefinedColors.find(color => !usedColors.includes(color))
    return availableColor || predefinedColors[0]
  }, [categories])

  // Carregar categorias na inicialização
  useEffect(() => {
    fetchCategories()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    categories,
    loading,
    pagination,
    filters,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    fetchActiveCategories,
    predefinedColors,
    getNextAvailableColor,
    setFilters
  }
}