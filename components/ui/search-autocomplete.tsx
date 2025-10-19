'use client'

import { useState, useEffect, useRef } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface SearchItem {
  id: number
  name: string
  [key: string]: any
}

interface SearchAutocompleteProps {
  placeholder?: string
  onSearch: (query: string) => Promise<SearchItem[]>
  onSelect: (item: SearchItem) => void
  selectedItem?: SearchItem | null
  onClear?: () => void
  className?: string
  disabled?: boolean
}

export default function SearchAutocomplete({
  placeholder = 'Digite para pesquisar...',
  onSearch,
  onSelect,
  selectedItem,
  onClear,
  className = '',
  disabled = false
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (selectedItem) {
      setQuery(selectedItem.name)
      setShowSuggestions(false)
    }
  }, [selectedItem])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (query.length >= 2 && !selectedItem) {
      debounceRef.current = setTimeout(async () => {
        setIsLoading(true)
        try {
          const results = await onSearch(query)
          setSuggestions(results)
          setShowSuggestions(true)
          setSelectedIndex(-1)
        } catch (error) {
          console.error('Erro na busca:', error)
          setSuggestions([])
        } finally {
          setIsLoading(false)
        }
      }, 300)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, onSearch, selectedItem])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    
    if (selectedItem && value !== selectedItem.name) {
      onClear?.()
    }
  }

  const handleSelectItem = (item: SearchItem) => {
    setQuery(item.name)
    setShowSuggestions(false)
    setSuggestions([])
    onSelect(item)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setShowSuggestions(false)
    setSelectedIndex(-1)
    onClear?.()
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectItem(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }, 150)
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        
        {(query || selectedItem) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none"
        >
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500">
              Carregando...
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectItem(item)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                  index === selectedIndex ? 'bg-gray-100' : ''
                }`}
              >
                <div className="font-medium text-gray-900">{item.name}</div>
                {item.code && (
                  <div className="text-gray-500">Código: {item.code}</div>
                )}
                {item.cnpj && (
                  <div className="text-gray-500">CNPJ: {item.cnpj}</div>
                )}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">
              Nenhum resultado encontrado
            </div>
          )}
        </div>
      )}
    </div>
  )
}