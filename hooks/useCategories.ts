import { useState, useEffect } from 'react'
// import { getCurrentUser } from '@/lib/auth-client' // Authentication removed

export interface Category {
  id: number
  name: string
  isElectrical: boolean
  description?: string
  is_active?: boolean
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/categories', {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro ao buscar categorias: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      if (Array.isArray(data)) {
        setCategories(data)
        console.log('Categories loaded:', data.length)
      } else {
        console.error('Invalid categories data format:', data)
        setCategories([])
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories
  }
}