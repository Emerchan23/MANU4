'use client'

import { useState, useEffect } from 'react'
import { 
  MagnifyingGlassIcon, 
  DocumentArrowDownIcon, 
  ChartBarIcon, 
  FunnelIcon, 
  CheckCircleIcon, 
  BuildingOfficeIcon, 
  CurrencyDollarIcon, 
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { MainLayout } from '@/components/layout/main-layout'
import { DateInput } from '@/components/ui/date-input'

interface Equipment {
  id: number
  name: string
  code: string
  patrimonio_number: string
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

interface Company {
  id: number
  name: string
  cnpj: string
  contact_person: string
  phone: string
  email: string
  city: string
  state: string
  total_services: number
  total_cost: number
  average_cost: number
  first_service_date: string
  last_service_date: string
}

interface CompaniesResponse {
  companies: Company[]
  stats: {
    total_companies: number
    total_services: number
    total_amount: number
    average_service_cost: number
  }
  period: {
    start_date: string | null
    end_date: string | null
  }
}

type TabType = 'equipments' | 'companies'

export default function RelatoriosPage() {
  // Controle de abas
  const [activeTab, setActiveTab] = useState<TabType>('equipments')
  
  // Filtros
  const [selectedSector, setSelectedSector] = useState<string>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchText, setSearchText] = useState('')
  const [dateError, setDateError] = useState('')
  
  // Dados - Equipamentos
  const [sectors, setSectors] = useState<Sector[]>([])
  const [equipmentResults, setEquipmentResults] = useState<Equipment[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([])
  const [equipmentStats, setEquipmentStats] = useState<EquipmentStats | null>(null)
  
  // Dados - Empresas
  const [companiesData, setCompaniesData] = useState<CompaniesResponse | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  
  // Estados
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)

  // Carregar setores ao inicializar
  useEffect(() => {
    fetchSectors()
  }, [])

  // Carregar empresas quando a aba for selecionada
  useEffect(() => {
    if (activeTab === 'companies') {
      searchCompanies()
    }
  }, [activeTab])

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

  const searchCompanies = async () => {
    setLoadingCompanies(true)
    setDateError('')
    setHasSearched(true)
    
    try {
      // Validação de datas
      if (startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        
        if (start > end) {
          setDateError('A data inicial deve ser menor que a data final')
          setLoadingCompanies(false)
          return
        }
        
        const today = new Date()
        today.setHours(23, 59, 59, 999)
        
        if (start > today) {
          setDateError('A data inicial não pode ser futura')
          setLoadingCompanies(false)
          return
        }
        
        if (end > today) {
          setDateError('A data final não pode ser futura')
          setLoadingCompanies(false)
          return
        }
      }

      // Construir URL com filtros
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      
      const response = await fetch(`/api/relatorios/companies?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCompaniesData(data)
      } else {
        console.error('Erro na resposta da API:', response.status, response.statusText)
        setCompaniesData(null)
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
      setCompaniesData(null)
    } finally {
      setLoadingCompanies(false)
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

  const selectCompany = (company: Company) => {
    setSelectedCompany(company)
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

  // Função para trocar de aba
  const switchTab = (tab: TabType) => {
    setActiveTab(tab)
    clearFilters()
  }
  
  // Função para limpar filtros
  const clearFilters = () => {
    setSelectedSector('')
    setStartDate('')
    setEndDate('')
    setSearchText('')
    setDateError('')
    setHasSearched(false)
    setEquipmentResults([])
    setSelectedEquipment(null)
    setMaintenanceHistory([])
    setEquipmentStats(null)
    setCompaniesData(null)
    setSelectedCompany(null)
  }
  

  
  // Função para gerar PDF do equipamento
  const generatePDF = async () => {
    if (!selectedEquipment) {
      alert('Selecione um equipamento primeiro')
      return
    }
  
    setGeneratingPDF(true)
    
    try {
      const response = await fetch(`/api/relatorios/equipment/${selectedEquipment.id}/pdf-fast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate
        })
      })
  
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `relatorio-equipamento-${selectedEquipment.id}-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        alert('PDF do relatório baixado com sucesso!')
      } else {
        const errorText = await response.text()
        alert(`Erro ao gerar PDF: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert(`Erro ao gerar PDF: ${error.message}`)
    } finally {
      setGeneratingPDF(false)
    }
  }
  
  // Função para gerar PDF da empresa
  const generateCompanyPDF = async () => {
    if (!selectedCompany) {
      alert('Selecione uma empresa primeiro')
      return
    }
  
    setGeneratingPDF(true)
    
    try {
      const response = await fetch(`/api/relatorios/companies/${selectedCompany.id}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate
        })
      })
  
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `relatorio-empresa-${selectedCompany.id}-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        alert('PDF do relatório da empresa baixado com sucesso!')
      } else {
        const errorText = await response.text()
        alert(`Erro ao gerar PDF: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Erro ao gerar PDF da empresa:', error)
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
            <p className="text-gray-600">Selecione uma aba e gere relatórios detalhados em PDF</p>
          </div>

          {/* Sistema de Abas */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => switchTab('equipments')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'equipments'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <ChartBarIcon className="w-5 h-5 inline-block mr-2" />
                  Equipamentos
                </button>
                <button
                  onClick={() => switchTab('companies')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'companies'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <BuildingOfficeIcon className="w-5 h-5 inline-block mr-2" />
                  Empresas
                </button>
              </nav>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center mb-4">
              <FunnelIcon className="w-5 h-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Filtros de Busca</h2>
            </div>
            
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${activeTab === 'equipments' ? '4' : '3'} gap-4 mb-4`}>
              {/* Setor - apenas para equipamentos */}
              {activeTab === 'equipments' && (
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
              )}

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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {activeTab === 'equipments' ? 'Buscar Equipamento' : 'Buscar Empresa'}
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder={activeTab === 'equipments' ? 'Nome ou código...' : 'Nome da empresa...'}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={activeTab === 'equipments' ? searchEquipments : searchCompanies}
                disabled={loading || loadingCompanies}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  !(loading || loadingCompanies)
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {(loading || loadingCompanies) ? 'Buscando...' : 
                  activeTab === 'equipments' ? 'Buscar Equipamentos' : 'Buscar Empresas'}
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

          {/* Conteúdo das Abas */}
          {activeTab === 'equipments' ? (
            // Aba de Equipamentos (conteúdo existente)
            <>
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
                                    <span className="font-medium">Patrimônio:</span> {equipment.patrimonio_number}
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
                                <span className="font-medium text-gray-700">Patrimônio:</span>
                                <span className="ml-2 text-gray-600">{selectedEquipment.patrimonio_number}</span>
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

              {/* Estado Inicial - Equipamentos */}
              {!hasSearched && (
                <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                  <ChartBarIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Bem-vindo aos Relatórios de Equipamentos</h3>
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
            </>
          ) : (
            // Aba de Empresas (novo conteúdo)
            <>
              {hasSearched && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Lista de Empresas */}
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Empresas Encontradas ({companiesData?.companies?.length || 0})
                        </h3>
                      </div>

                      {companiesData?.companies && companiesData.companies.length > 0 ? (
                        <>
                          {/* Cards de Estatísticas */}
                          <div className="p-6 border-b border-gray-200">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                  <BuildingOfficeIcon className="w-8 h-8 text-blue-600 mr-3" />
                                  <div>
                                    <p className="text-sm font-medium text-blue-900">Total Empresas</p>
                                    <p className="text-2xl font-bold text-blue-600">{companiesData.stats.total_companies}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-green-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                  <CurrencyDollarIcon className="w-8 h-8 text-green-600 mr-3" />
                                  <div>
                                    <p className="text-sm font-medium text-green-900">Valor Total</p>
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(companiesData.stats.total_amount)}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-purple-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                  <ClipboardDocumentListIcon className="w-8 h-8 text-purple-600 mr-3" />
                                  <div>
                                    <p className="text-sm font-medium text-purple-900">Total Serviços</p>
                                    <p className="text-2xl font-bold text-purple-600">{companiesData.stats.total_services}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-orange-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                  <ChartBarIcon className="w-8 h-8 text-orange-600 mr-3" />
                                  <div>
                                    <p className="text-sm font-medium text-orange-900">Valor Médio</p>
                                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(companiesData.stats.average_service_cost)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Lista de Empresas */}
                          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                            {companiesData.companies.map((company) => (
                              <div
                                key={company.id}
                                onClick={() => selectCompany(company)}
                                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                  selectedCompany?.id === company.id 
                                    ? 'bg-blue-50 border-l-4 border-blue-500' 
                                    : ''
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 mb-1">{company.name}</h4>
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">CNPJ:</span> {company.cnpj || 'Não informado'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">Cidade:</span> {company.city || 'Não informado'} - {company.state || 'N/A'}
                                    </p>
                                    <div className="mt-2 flex gap-4">
                                      <span className="text-sm font-medium text-green-600">
                                        {formatCurrency(company.total_cost)}
                                      </span>
                                      <span className="text-sm text-gray-500">
                                        {company.total_services} serviços
                                      </span>
                                    </div>
                                  </div>
                                  {selectedCompany?.id === company.id && (
                                    <CheckCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="px-6 py-12 text-center">
                          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-sm font-medium text-gray-900 mb-2">Nenhuma empresa encontrada</h3>
                          <p className="text-sm text-gray-500">
                            Tente ajustar os filtros ou verificar se há empresas cadastradas.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Painel da Empresa Selecionada */}
                  <div className="lg:col-span-1">
                    {selectedCompany ? (
                      <div className="bg-white rounded-lg shadow-sm border">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900">Empresa Selecionada</h3>
                        </div>
                        
                        <div className="p-6">
                          {/* Informações da Empresa */}
                          <div className="mb-6">
                            <h4 className="font-medium text-gray-900 mb-3">{selectedCompany.name}</h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">CNPJ:</span>
                                <span className="ml-2 text-gray-600">{selectedCompany.cnpj}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Email:</span>
                                <span className="ml-2 text-gray-600">{selectedCompany.contact_email}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Telefone:</span>
                                <span className="ml-2 text-gray-600">{selectedCompany.contact_phone}</span>
                              </div>
                            </div>
                          </div>

                          {/* Estatísticas da Empresa */}
                          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-3">Resumo Financeiro</h5>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-700">Total de Serviços:</span>
                                <span className="text-blue-600 font-semibold">{selectedCompany.total_services}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-700">Valor Total:</span>
                                <span className="text-green-600 font-semibold">{formatCurrency(selectedCompany.total_cost)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-700">Valor Médio:</span>
                                <span className="text-purple-600 font-semibold">{formatCurrency(selectedCompany.average_cost)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Preview do Relatório */}
                          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                            <h5 className="font-medium text-blue-900 mb-2">O que será incluído no PDF:</h5>
                            <ul className="text-sm text-blue-800 space-y-1">
                              <li>• Informações completas da empresa</li>
                              <li>• Histórico de serviços no período</li>
                              <li>• Estatísticas financeiras</li>
                              <li>• Gráficos de evolução mensal</li>
                              <li>• {selectedCompany.total_services} serviços realizados</li>
                            </ul>
                          </div>

                          {/* BOTÃO PDF */}
                          <button
                            onClick={generateCompanyPDF}
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
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                        <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Selecione uma Empresa</h3>
                        <p className="text-sm text-gray-500">
                          Clique em uma empresa da lista para ver suas informações e gerar o relatório PDF.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Estado Inicial - Empresas */}
              {!hasSearched && (
                <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                  <BuildingOfficeIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Bem-vindo aos Relatórios de Empresas</h3>
                  <p className="text-gray-500 mb-6">
                    Use os filtros acima para buscar empresas prestadoras e gerar relatórios financeiros em PDF.
                  </p>
                  <button
                    onClick={searchCompanies}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Buscar Todas as Empresas
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  )
}