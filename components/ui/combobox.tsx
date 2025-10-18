'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  allowCustomValue?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Selecione uma opção...',
  searchPlaceholder = 'Pesquisar...',
  emptyText = 'Nenhuma opção encontrada.',
  className,
  disabled = false,
  allowCustomValue = true,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')
  const [displayValue, setDisplayValue] = React.useState('')

  // Filtrar opções baseado na pesquisa
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [options, searchValue])



  // Atualizar o valor de exibição quando o valor prop mudar
  React.useEffect(() => {
    if (value) {
      const option = options.find((option) => option.value === value)
      setDisplayValue(option ? option.label : value)
    } else {
      setDisplayValue('')
    }
  }, [value, options])

  const handleSelect = (selectedValue: string) => {
    const option = options.find((option) => option.value === selectedValue)
    if (option) {
      onValueChange(selectedValue)
      setDisplayValue(option.label)
    }
    setOpen(false)
    setSearchValue('')
  }

  const handleCustomValue = () => {
    if (allowCustomValue && searchValue.trim()) {
      onValueChange(searchValue.trim())
      setDisplayValue(searchValue.trim())
      setOpen(false)
      setSearchValue('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && allowCustomValue && searchValue.trim()) {
      e.preventDefault()
      handleCustomValue()
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between',
            !displayValue && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          {displayValue || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-50" align="start">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-2 text-center text-sm">
                {emptyText}
                {allowCustomValue && searchValue.trim() && (
                  <div className="mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCustomValue}
                      className="text-xs"
                    >
                      Usar &quot;{searchValue.trim()}&quot;
                    </Button>
                  </div>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
              {allowCustomValue && searchValue.trim() && !filteredOptions.some(option => 
                option.label.toLowerCase() === searchValue.toLowerCase()
              ) && (
                <CommandItem
                  value={searchValue.trim()}
                  onSelect={handleCustomValue}
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  Usar &quot;{searchValue.trim()}&quot;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}