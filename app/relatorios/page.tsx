'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, DocumentArrowDownIcon, ChartBarIcon, FunnelIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { MainLayout } from '@/components/layout/main-layout'
import { DateInput } from '@/components/ui/date-input'

interface Equipment {
  id: number
  name: string
  code: string
  model: string
  manufacturer: string
  sector_name: string
}

interface Sector {
  id: number
  name: string
  description: string
}

interface MaintenanceRecord {
  id: number
  date: string
  type: string
  description: string
  status: string
  technician_name: string
  cost: number
}

interface EquipmentStats {
  totalMaintenances: number
  totalCost: number
  averageRepairTime: number
  successRate: number
}

export default function RelatoriosPage() {
  // Filtros
  const [selectedSector, setSelectedSector] = useState<string>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchText, setSearchText] = useState('')
  const [dateError, setDateError] = useState('')
  
  // Dados
  const [sectors, setSectors] = useState<Sector[]>([])
  const [equipmentResults, setEquipmentResults] = useState<Equipment[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([])
  const [equipmentStats, setEquipmentStats] = useState<EquipmentStats | null>(null)
  
  // Estados
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)

  // Carregar setores ao inicializar
  useEffect(() => {
    fetchSectors()
  }, [])

  const fetchSectors = async () => {
    try {
      const response = await fetch('/api/sectors')
      if (response.ok) {
        const data = await response.json()
        setSectors(data)
      }
    } catch (error) {
      console.error('Erro ao buscar setores:', error)
    }
  }

  const searchEquipments = async () => {
    setLoading(true)
    setDateError('')
    setHasSearched(true)
    
    try {
      // Validação de datas
      if (startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        
        if (start > end) {
          setDateError('A data inicial deve ser menor que a data final')
          setLoading(false)
          return
        }
        
        const today = new Date()
        today.setHours(23, 59, 59, 999)
        
        if (start > today) {
          setDateError('A data inicial não pode ser futura')
          setLoading(false)
          return
        }
        
        if (end > today) {
          setDateError('A data final não pode ser futura')
          setLoading(false)
          return
        }
      }

      // Construir URL com filtros
      const params = new URLSearchParams()
      if (selectedSector) params.append('sector', selectedSector)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (searchText && searchText.trim().length >= 2) params.append('q', searchText.trim())
      
      const response = await fetch(`/api/relatorios/equipment/search?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setEquipmentResults(data)
      } else {
        console.error('Erro na resposta da API:', response.status, response.statusText)
        setEquipmentResults([])
      }
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error)
      setEquipmentResults([])
    } finally {
      setLoading(false)
    }
  }

  const selectEquipment = async (equipment: Equipment) => {
    setSelectedEquipment(equipment)
    
    // Limpar dados anteriores
    setMaintenanceHistory([])
    setEquipmentStats(null)
    
    // Carregar dados do equipamento
    await loadEquipmentData(equipment.id, startDate, endDate)
  }

  const loadEquipmentData = async (equipmentId: number, startDate?: string, endDate?: string) => {
    try {
      // Construir URL com parâmetros de período se fornecidos
      let historyUrl = `/api/relatorios/equipment/${equipmentId}/history`
      const params = new URLSearchParams()
      
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      
      if (params.toString()) {
        historyUrl += `?${params.toString()}`
      }

      // Fetch maintenance history
      const historyResponse = await fetch(historyUrl)
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setMaintenanceHistory(historyData)
      } else {
        setMaintenanceHistory([])
      }

      // Fetch equipment statistics
      const statsResponse = await fetch(`/api/relatorios/equipment/${equipmentId}/stats`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setEquipmentStats(statsData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do equipamento:', error)
    }
  }

  const clearFilters = () => {
    setSelectedSector('')
    setStartDate('')
    setEndDate('')
    setSearchText('')
    setDateError('')
    setEquipmentResults([])
    setSelectedEquipment(null)
    setMaintenanceHistory([])
    setEquipmentStats(null)
    setHasSearched(false)
  }

  const generatePDF = async () => {
    if (!selectedEquipment) return
    
    setGeneratingPDF(true)
    
    try {
      console.log('🔍 Gerando PDF para equipamento:', selectedEquipment.id, selectedEquipment.name)
      
      // Preparar dados para enviar no body da requisição POST
      const requestData = {
        equipmentId: selectedEquipment.id,
        startDate: startDate || null,
        endDate: endDate || null
      }
      
      console.log('📊 Dados da requisição:', requestData)
      
      const response = await fetch(`/api/relatorios/equipment/${selectedEquipment.id}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
      
      console.log('📊 Status da resposta:', response.status)
      console.log('📊 Headers da resposta:', response.headers.get('content-type'))
      
      if (response.ok) {
        const blob = await response.blob()
        console.log('✅ PDF recebido, tamanho:', blob.size, 'bytes')
        
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `relatorio-${selectedEquipment.name.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        console.log('✅ PDF baixado com sucesso!')
      } else {
        const errorText = await response.text()
        console.error('❌ Erro na resposta da API:', response.status, errorText)
        alert(`Erro ao gerar PDF: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('💥 Erro ao gerar PDF:', error)
      alert(`Erro ao gerar PDF: ${error.message}`)
    } finally {
      setGeneratingPDF(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatórios de Manutenção</h1>
            <p className="text-gray-600">Selecione um equipamento e gere relatórios detalhados em PDF</p>
          </div>

          {/* Filtros - Layout Horizontal Simples */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center mb-4">
              <FunnelIcon className="w-5 h-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Filtros de Busca</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Setor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos os setores</option>
                  {sectors.map((sector) => (
                    <option key={sector.id} value={sector.id.toString()}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data Inicial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                <DateInput
                  value={startDate}
                  onChange={(value) => setStartDate(value)}
                  className="w-full"
                  placeholder="dd/mm/aaaa"
                />
              </div>

              {/* Data Final */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                <DateInput
                  value={endDate}
                  onChange={(value) => setEndDate(value)}
                  className="w-full"
                  placeholder="dd/mm/aaaa"
                />
              </div>

              {/* Busca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Equipamento</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Nome ou código..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={searchEquipments}
                disabled={loading}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  !loading
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? 'Buscando...' : 'Buscar Equipamentos'}
              </button>
              
              {hasSearched && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Limpar Filtros
                </button>
              )}
            </div>

            {dateError && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
                {dateError}
              </div>
            )}
          </div>

          {/* Resultados */}
          {hasSearched && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lista de Equipamentos */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Equipamentos Encontrados ({equipmentResults.length})
                    </h3>
                  </div>

                  {equipmentResults.length > 0 ? (
                    <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                      {equipmentResults.map((equipment) => (
                        <div
                          key={equipment.id}
                          onClick={() => selectEquipment(equipment)}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                            selectedEquipment?.id === equipment.id 
                              ? 'bg-blue-50 border-l-4 border-blue-500' 
                              : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">{equipment.name}</h4>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Código:</span> {equipment.code}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Setor:</span> {equipment.sector_name}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Fabricante:</span> {equipment.manufacturer}
                              </p>
                            </div>
                            {selectedEquipment?.id === equipment.id && (
                              <CheckCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-6 py-12 text-center">
                      <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Nenhum equipamento encontrado</h3>
                      <p className="text-sm text-gray-500">
                        Tente ajustar os filtros ou verificar se há equipamentos cadastrados.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Painel do Equipamento Selecionado */}
              <div className="lg:col-span-1">
                {selectedEquipment ? (
                  <div className="bg-white rounded-lg shadow-sm border">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Equipamento Selecionado</h3>
                    </div>
                    
                    <div className="p-6">
                      {/* Informações do Equipamento */}
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-3">{selectedEquipment.name}</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Código:</span>
                            <span className="ml-2 text-gray-600">{selectedEquipment.code}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Modelo:</span>
                            <span className="ml-2 text-gray-600">{selectedEquipment.model}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Fabricante:</span>
                            <span className="ml-2 text-gray-600">{selectedEquipment.manufacturer}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Setor:</span>
                            <span className="ml-2 text-gray-600">{selectedEquipment.sector_name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Estatísticas Rápidas */}
                      {equipmentStats && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-3">Resumo</h5>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="font-medium text-gray-700">Manutenções</div>
                              <div className="text-lg font-semibold text-blue-600">
                                {equipmentStats.totalMaintenances}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium text-gray-700">Custo Total</div>
                              <div className="text-lg font-semibold text-green-600">
                                {formatCurrency(equipmentStats.totalCost)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Preview do Relatório */}
                      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                        <h5 className="font-medium text-blue-900 mb-2">O que será incluído no PDF:</h5>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Informações completas do equipamento</li>
                          <li>• Histórico de manutenções no período</li>
                          <li>• Estatísticas e custos</li>
                          <li>• Gráficos e análises</li>
                          {maintenanceHistory.length > 0 && (
                            <li>• {maintenanceHistory.length} registros de manutenção</li>
                          )}
                        </ul>
                      </div>

                      {/* BOTÃO PDF - SEMPRE VISÍVEL */}
                      <button
                        onClick={generatePDF}
                        disabled={generatingPDF}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                          !generatingPDF
                            ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                        {generatingPDF ? 'Gerando PDF...' : 'Gerar Relatório PDF'}
                      </button>

                      {maintenanceHistory.length === 0 && (
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          * Relatório será gerado mesmo sem histórico de manutenções
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                    <DocumentArrowDownIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Selecione um Equipamento</h3>
                    <p className="text-sm text-gray-500">
                      Clique em um equipamento da lista para ver suas informações e gerar o relatório PDF.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estado Inicial */}
          {!hasSearched && (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <ChartBarIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Bem-vindo aos Relatórios</h3>
              <p className="text-gray-500 mb-6">
                Use os filtros acima para buscar equipamentos e gerar relatórios detalhados em PDF.
              </p>
              <button
                onClick={searchEquipments}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Buscar Todos os Equipamentos
              </button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}