'use client'

import { useState } from 'react'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

interface Column {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
  className?: string
}

interface DataTableProps {
  columns: Column[]
  data: any[]
  loading?: boolean
  emptyMessage?: string
  className?: string
  maxHeight?: string
}

type SortDirection = 'asc' | 'desc' | null

export default function DataTable({
  columns,
  data,
  loading = false,
  emptyMessage = 'Nenhum dado encontrado',
  className = '',
  maxHeight = 'max-h-96'
}: DataTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey)
    if (!column?.sortable) return

    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn(null)
        setSortDirection(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0

    const aValue = a[sortColumn]
    const bValue = b[sortColumn]

    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    let comparison = 0
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue, 'pt-BR')
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue
    } else if (aValue instanceof Date && bValue instanceof Date) {
      comparison = aValue.getTime() - bValue.getTime()
    } else {
      comparison = String(aValue).localeCompare(String(bValue), 'pt-BR')
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <div className="w-4 h-4" />
    }
    
    if (sortDirection === 'asc') {
      return <ChevronUpIcon className="w-4 h-4" />
    } else if (sortDirection === 'desc') {
      return <ChevronDownIcon className="w-4 h-4" />
    }
    
    return <div className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className={`bg-white shadow overflow-hidden sm:rounded-md ${className}`}>
        <div className="px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={`bg-white shadow overflow-hidden sm:rounded-md ${className}`}>
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white shadow overflow-hidden sm:rounded-md ${className}`}>
      <div className={`overflow-auto ${maxHeight}`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  } ${column.className || ''}`}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.className || ''}`}
                  >
                    {column.render 
                      ? column.render(row[column.key], row)
                      : row[column.key] || '-'
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}