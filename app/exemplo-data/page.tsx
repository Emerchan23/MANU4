"use client"

import { useState } from 'react'
import { DateInput } from '@/components/ui/date-input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  formatDateBR, 
  convertBRToISO, 
  convertISOToBR,
  isValidBRDate,
  getCurrentDateBR 
} from '@/lib/date-utils'

export default function DateInputExample() {
  const [data1, setData1] = useState('')
  const [data2, setData2] = useState('')
  const [data3, setData3] = useState('')
  const [dataAtual, setDataAtual] = useState('')

  const handlePreencherDataAtual = () => {
    const hoje = new Date().toISOString().split('T')[0]
    setDataAtual(hoje)
  }

  const handleLimparTodos = () => {
    setData1('')
    setData2('')
    setData3('')
    setDataAtual('')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Demonstração - Campo de Data Brasileiro</h1>
        <p className="text-muted-foreground">
          Todos os campos de data utilizam o formato brasileiro: DD/MM/AAAA
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1 - Exemplo Básico */}
        <Card>
          <CardHeader>
            <CardTitle>Exemplo Básico</CardTitle>
            <CardDescription>
              Digite apenas números, a máscara será aplicada automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data1">Data de Nascimento</Label>
              <DateInput
                id="data1"
                value={data1}
                onChange={(value) => setData1(value)}
                placeholder="dd/mm/aaaa"
              />
            </div>
            
            {data1 && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Informações da Data:</p>
                <div className="text-sm space-y-1">
                  <p><strong>Valor armazenado (ISO):</strong> {data1}</p>
                  <p><strong>Formato brasileiro:</strong> {convertISOToBR(data1)}</p>
                  <p><strong>Data válida:</strong> {isValidBRDate(convertISOToBR(data1)) ? '✅ Sim' : '❌ Não'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2 - Com Validação Obrigatória */}
        <Card>
          <CardHeader>
            <CardTitle>Campo Obrigatório</CardTitle>
            <CardDescription>
              Campo com validação obrigatória
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data2">Data de Vencimento *</Label>
              <DateInput
                id="data2"
                value={data2}
                onChange={(value) => setData2(value)}
                required
              />
            </div>
            
            {data2 && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Informações da Data:</p>
                <div className="text-sm space-y-1">
                  <p><strong>Valor armazenado (ISO):</strong> {data2}</p>
                  <p><strong>Formato brasileiro:</strong> {convertISOToBR(data2)}</p>
                  <p><strong>Formatado:</strong> {formatDateBR(data2)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3 - Preenchimento Automático */}
        <Card>
          <CardHeader>
            <CardTitle>Preenchimento Automático</CardTitle>
            <CardDescription>
              Preencher com a data atual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dataAtual">Data Atual</Label>
              <DateInput
                id="dataAtual"
                value={dataAtual}
                onChange={(value) => setDataAtual(value)}
              />
            </div>
            
            <Button onClick={handlePreencherDataAtual} className="w-full">
              Preencher com Data Atual
            </Button>

            {dataAtual && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Data Atual:</p>
                <div className="text-sm space-y-1">
                  <p><strong>ISO:</strong> {dataAtual}</p>
                  <p><strong>Brasileiro:</strong> {convertISOToBR(dataAtual)}</p>
                  <p><strong>Hoje (BR):</strong> {getCurrentDateBR()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 4 - Múltiplos Campos */}
        <Card>
          <CardHeader>
            <CardTitle>Período de Datas</CardTitle>
            <CardDescription>
              Selecione um período (data inicial e final)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data3">Data Inicial</Label>
              <DateInput
                id="data3"
                value={data3}
                onChange={(value) => setData3(value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data4">Data Final</Label>
              <DateInput
                id="data4"
                value={data2}
                onChange={(value) => setData2(value)}
              />
            </div>

            {data3 && data2 && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Período Selecionado:</p>
                <div className="text-sm space-y-1">
                  <p><strong>De:</strong> {convertISOToBR(data3)}</p>
                  <p><strong>Até:</strong> {convertISOToBR(data2)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Card de Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Como Usar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">✅ Formato Aceito</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Digite apenas números: 25012024</li>
                <li>A máscara adiciona "/" automaticamente: 25/01/2024</li>
                <li>Formato final: DD/MM/AAAA</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">🔍 Validação</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Dia: 01 a 31</li>
                <li>Mês: 01 a 12</li>
                <li>Ano: 1900 a 2100</li>
                <li>Valida datas reais (ex: 31/02/2024 é inválido)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">💾 Armazenamento</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Exibição: DD/MM/AAAA (formato brasileiro)</li>
                <li>Armazenamento: YYYY-MM-DD (formato ISO)</li>
                <li>Conversão automática entre formatos</li>
              </ul>
            </div>

            <div className="pt-4">
              <Button onClick={handleLimparTodos} variant="outline" className="w-full">
                Limpar Todos os Campos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Exemplos de Código */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplo de Código</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`import { DateInput } from '@/components/ui/date-input'
import { Label } from '@/components/ui/label'

function MeuFormulario() {
  const [data, setData] = useState('')

  return (
    <div className="space-y-2">
      <Label htmlFor="data">Data</Label>
      <DateInput
        id="data"
        value={data}
        onChange={(value) => setData(value)}
        placeholder="dd/mm/aaaa"
        required
      />
    </div>
  )
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
