"use client"

import React, { forwardRef, useState, useEffect } from 'react'
import { Input } from './input'
import { formatDateBR, convertBRToISO, isValidBRDate, formatForHTMLInput, convertHTMLInputToBR } from '@/lib/date-utils'

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  value?: string
  onChange?: (value: string) => void
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, className, placeholder = "dd/mm/aaaa", required, ...props }, ref) => {
    // Estado local para o valor formatado (DD/MM/AAAA)
    const [displayValue, setDisplayValue] = useState('')
    const [isoValue, setIsoValue] = useState('')

    // Sincronizar valor externo com display
    useEffect(() => {
      console.log('🔧 DateInput useEffect - valor recebido:', value, typeof value);
      
      if (value) {
        // Se o valor vier em formato ISO (YYYY-MM-DD), converter para BR
        if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
          console.log('🔧 DateInput - Formato ISO detectado');
          setDisplayValue(convertHTMLInputToBR(value))
          setIsoValue(value)
        } 
        // Se já estiver em formato BR (DD/MM/YYYY), usar diretamente
        else if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          console.log('🔧 DateInput - Formato BR detectado');
          setDisplayValue(value)
          const iso = convertBRToISO(value)
          setIsoValue(iso || '')
        }
        // Tentar formatar qualquer outro formato
        else {
          console.log('🔧 DateInput - Formato desconhecido, tentando formatar');
          try {
            const formatted = formatDateBR(value)
            setDisplayValue(formatted || '')
            if (formatted) {
              const iso = convertBRToISO(formatted)
              setIsoValue(iso || '')
            } else {
              setIsoValue('')
            }
          } catch {
            console.log('🔧 DateInput - Erro ao formatar, limpando campo');
            setDisplayValue('')
            setIsoValue('')
          }
        }
      } else {
        console.log('🔧 DateInput - Valor vazio, limpando campo');
        setDisplayValue('')
        setIsoValue('')
      }
      
      console.log('🔧 DateInput - displayValue final:', displayValue);
    }, [value])

    // Aplicar máscara de data brasileira
    const applyDateMask = (input: string): string => {
      // Remove tudo que não é número
      const numbers = input.replace(/\D/g, '')
      
      // Aplica a máscara DD/MM/AAAA
      if (numbers.length <= 2) {
        return numbers
      } else if (numbers.length <= 4) {
        return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
      } else {
        return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
      }
    }

    // Validar data brasileira
    const validateBRDate = (dateStr: string): boolean => {
      if (dateStr.length !== 10) return false
      
      const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
      if (!match) return false
      
      const day = parseInt(match[1], 10)
      const month = parseInt(match[2], 10)
      const year = parseInt(match[3], 10)
      
      // Validações básicas - ampliando o range de anos
      if (month < 1 || month > 12) return false
      if (day < 1 || day > 31) return false
      if (year < 1000 || year > 2100) return false
      
      // Validar data real
      const date = new Date(year, month - 1, day)
      return date.getDate() === day && 
             date.getMonth() === month - 1 && 
             date.getFullYear() === year
    }

    // Função para lidar com mudanças no input
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const maskedValue = applyDateMask(inputValue)
      
      setDisplayValue(maskedValue)
      
      // Se a data estiver completa e válida, notificar o onChange
      if (maskedValue.length === 10) {
        if (validateBRDate(maskedValue)) {
          // Converter para ISO antes de passar para o onChange
          const isoDate = convertBRToISO(maskedValue)
          if (onChange && isoDate) {
            setIsoValue(isoDate)
            onChange(isoDate)
          }
        } else {
          setIsoValue('')
        }
      } else if (maskedValue === '' && onChange) {
        // Se o campo foi limpo, notificar com string vazia
        setIsoValue('')
        onChange('')
      }
    }

    // Função para lidar com blur (quando o usuário sai do campo)
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const currentValue = displayValue
      
      // Apenas limpar se o formato estiver completamente inválido
      // Não limpar datas parciais ou válidas
      if (currentValue && currentValue.length === 10 && !validateBRDate(currentValue)) {
        // Só limpar se a data completa for inválida
        setDisplayValue('')
        setIsoValue('')
        if (onChange) {
          onChange('')
        }
      }
      // Preservar datas parciais e válidas - não limpar automaticamente
      
      // Chamar onBlur original se existir
      if (props.onBlur) {
        props.onBlur(e)
      }
    }

    return (
      <div className="relative">
        {/* Input hidden para validação HTML5 */}
        {required && (
          <input
            type="text"
            value={isoValue}
            required={required}
            style={{ 
              position: 'absolute', 
              left: '-9999px', 
              opacity: 0, 
              pointerEvents: 'none',
              width: '1px',
              height: '1px'
            }}
            tabIndex={-1}
            aria-hidden="true"
          />
        )}
        
        {/* Input visível para o usuário */}
        <Input
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={className}
          maxLength={10}
          {...props}
        />
      </div>
    )
  }
)

DateInput.displayName = "DateInput"

export { DateInput }
