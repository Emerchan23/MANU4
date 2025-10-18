'use client'

import React from 'react'
import { Combobox } from '@/components/ui/combobox'

const testOptions = [
  { value: '1', label: 'Categoria 1' },
  { value: '2', label: 'Categoria 2' },
  { value: '3', label: 'Categoria 3' },
]

export function TestCombobox() {
  const [value, setValue] = React.useState('')

  console.log('🧪 Test Combobox - Value:', value)
  console.log('🧪 Test Combobox - Options:', testOptions)

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Teste do Combobox</h2>
      <div className="w-64">
        <Combobox
          options={testOptions}
          value={value}
          onValueChange={setValue}
          placeholder="Selecione uma opção de teste"
          searchPlaceholder="Pesquisar..."
          emptyText="Nenhuma opção encontrada."
          allowCustomValue={false}
        />
      </div>
      <p>Valor selecionado: {value || 'Nenhum'}</p>
    </div>
  )
}