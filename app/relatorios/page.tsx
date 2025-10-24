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
  
  // Estados de carregamento
  const [loading, setLoading] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Carregar setores ao montar o componente
  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const response = await fetch('/api/sectors')
        if (response.ok) {
          const data = await response.json()
          setSectors(data)
        }
      } catch (error) {
        console.error('Erro ao carregar setores:', error)
      }
    }

    fetchSectors()
  }, [])

  // Função para buscar equipamentos
  const searchEquipments = async () => {
    setLoading(true)
    setHasSearched(true)
    
    try {
      const params = new URLSearchParams()
      if (selectedSector) params.append('sector_id', selectedSector)
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      if (searchText) params.append('search', searchText)

      const response = await fetch(`/api/equipments/search?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setEquipmentResults(data)
      } else {
        setEquipmentResults([])
      }
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error)
      setEquipmentResults([])
    } finally {
      setLoading(false)
    }
  }

  // Função para buscar empresas
  const searchCompanies = async () => {
    setLoadingCompanies(true)
    setHasSearched(true)
    
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      if (searchText) params.append('search', searchText)

      const response = await fetch(`/api/companies/reports?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setCompaniesData(data)
      } else {
        setCompaniesData(null)
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
      setCompaniesData(null)
    } finally {
      setLoadingCompanies(false)
    }
  }

  // Função para selecionar equipamento
  const selectEquipment = async (equipment: Equipment) => {
    setSelectedEquipment(equipment)
    setMaintenanceHistory([])
    setEquipmentStats(null)
    
    try {
      // Buscar histórico de manutenções
      const historyResponse = await fetch(`/api/equipments/${equipment.id}/maintenance-history`)
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setMaintenanceHistory(historyData)
      }

      // Buscar estatísticas
      const statsResponse = await fetch(`/api/equipments/${equipment.id}/stats`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setEquipmentStats(statsData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do equipamento:', error)
    }
  }

  // Função para selecionar empresa
  const selectCompany = (company: Company) => {
    setSelectedCompany(company)
  }

  // Função para limpar filtros
  const clearFilters = () => {
    setSelectedSector('')
    setStartDate('')
    setEndDate('')
    setSearchText('')
    setEquipmentResults([])
    setSelectedEquipment(null)
    setMaintenanceHistory([])
    setEquipmentStats(null)
    setCompaniesData(null)
    setSelectedCompany(null)
    setHasSearched(false)
  }

  // Função para gerar PDF do equipamento
  const generatePDF = async () => {
    if (!selectedEquipment) {
      alert('Selecione um equipamento primeiro')
      return
    }

    setGeneratingPDF(true)
    
    try {
      const response = await fetch('/api/reports/equipment-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          equipmentId: selectedEquipment.id,
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
    } catch (error: any) {
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
      const response = await fetch('/api/reports/company-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: selectedCompany.id,
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
    } catch (error: any) {
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Cabeçalho */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Relatórios de Manutenção</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Selecione uma aba e gere relatórios detalhados em PDF
            </p>
          </div>

          {/* Abas */}
          <div className="mb-8">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('equipments')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'equipments'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <ChartBarIcon className="w-5 h-5 inline mr-2" />
                  Equipamentos
                </button>
                <button
                  onClick={() => setActiveTab('companies')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'companies'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <BuildingOfficeIcon className="w-5 h-5 inline mr-2" />
                  Empresas
                </button>
              </nav>
            </div>
          </div>

          {/* Filtros */}
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center mb-4">
                <FunnelIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filtros de Busca</h3>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${activeTab === 'equipments' ? '4' : '3'} gap-4 mb-4`}>
                {/* Setor - apenas para equipamentos */}
                {activeTab === 'equipments' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Setor</label>
                    <select
                      value={selectedSector}
                      onChange={(e) => setSelectedSector(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Inicial</label>
                  <DateInput
                    value={startDate}
                    onChange={(value) => setStartDate(value)}
                    className="w-full"
                    placeholder="dd/mm/aaaa"
                  />
                </div>

                {/* Data Final */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Final</label>
                  <DateInput
                    value={endDate}
                    onChange={(value) => setEndDate(value)}
                    className="w-full"
                    placeholder="dd/mm/aaaa"
                  />
                </div>

                {/* Busca */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {activeTab === 'equipments' ? 'Buscar Equipamento' : 'Buscar Empresa'}
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder={activeTab === 'equipments' ? 'Nome ou código...' : 'Nome da empresa...'}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600' 
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {(loading || loadingCompanies) ? 'Buscando...' : 
                    activeTab === 'equipments' ? 'Buscar Equipamentos' : 'Buscar Empresas'}
                </button>
                
                {hasSearched && (
                  <button
                    onClick={clearFilters}
                    className="px-6 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-md hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors flex items-center"
                  >
                    <XMarkIcon className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Conteúdo das Abas */}
          {activeTab === 'equipments' ? (
            // Aba de Equipamentos
            <>
              {hasSearched && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Lista de Equipamentos */}
                  <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Equipamentos Encontrados ({equipmentResults.length})
                        </h3>
                      </div>

                      {equipmentResults.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                          {equipmentResults.map((equipment) => (
                            <div
                              key={equipment.id}
                              onClick={() => selectEquipment(equipment)}
                              className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                                selectedEquipment?.id === equipment.id 
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                                  : ''
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">{equipment.name}</h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    <span className="font-medium">Patrimônio:</span> {equipment.patrimonio_number}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    <span className="font-medium">Setor:</span> {equipment.sector_name}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    <span className="font-medium">Fabricante:</span> {equipment.manufacturer}
                                  </p>
                                </div>
                                {selectedEquipment?.id === equipment.id && (
                                  <CheckCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                          <ClipboardDocumentListIcon className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                          <p>Nenhum equipamento encontrado</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Painel do Equipamento Selecionado */}
                  <div className="lg:col-span-1">
                    {selectedEquipment ? (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detalhes do Equipamento</h3>
                        </div>
                        
                        <div className="p-6 space-y-6">
                          {/* Informações do Equipamento */}
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Informações</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Nome:</span>
                                <span className="text-gray-900 dark:text-white font-medium">{selectedEquipment.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Código:</span>
                                <span className="text-gray-900 dark:text-white font-medium">{selectedEquipment.code}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Patrimônio:</span>
                                <span className="text-gray-900 dark:text-white font-medium">{selectedEquipment.patrimonio_number}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Modelo:</span>
                                <span className="text-gray-900 dark:text-white font-medium">{selectedEquipment.model}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Fabricante:</span>
                                <span className="text-gray-900 dark:text-white font-medium">{selectedEquipment.manufacturer}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Setor:</span>
                                <span className="text-gray-900 dark:text-white font-medium">{selectedEquipment.sector_name}</span>
                              </div>
                            </div>
                          </div>

                          {/* Estatísticas Rápidas */}
                          {equipmentStats && (
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Estatísticas</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {equipmentStats.totalMaintenances}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Manutenções</div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(equipmentStats.totalCost)}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Custo Total</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Preview do Relatório */}
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Preview do Relatório</h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              <p>• Informações completas do equipamento</p>
                              <p>• Histórico de manutenções no período</p>
                              <p>• Estatísticas de desempenho</p>
                              <p>• Custos detalhados</p>
                            </div>
                          </div>

                          {/* BOTÃO PDF - SEMPRE VISÍVEL */}
                          <button
                            onClick={generatePDF}
                            disabled={generatingPDF}
                            className={`w-full px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center ${
                              !generatingPDF
                                ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
                                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                            {generatingPDF ? 'Gerando PDF...' : 'Gerar Relatório PDF'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                        <WrenchScrewdriverIcon className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <p className="text-gray-500 dark:text-gray-400">Selecione um equipamento para ver os detalhes</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Estado Inicial - Equipamentos */}
              {!hasSearched && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <ChartBarIcon className="w-16 h-16 mx-auto mb-6 text-gray-300 dark:text-gray-600" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Bem-vindo aos Relatórios de Equipamentos</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Use os filtros acima para buscar equipamentos e gerar relatórios detalhados em PDF.
                  </p>
                  <button
                    onClick={searchEquipments}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                  >
                    Buscar Todos os Equipamentos
                  </button>
                </div>
              )}
            </>
          ) : (
            // Aba de Empresas
            <>
              {hasSearched && companiesData && (
                <div className="space-y-6">
                  {/* Cards de Estatísticas */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Empresas</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{companiesData.stats.total_companies}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center">
                        <WrenchScrewdriverIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Serviços</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{companiesData.stats.total_services}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(companiesData.stats.total_amount)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center">
                        <CalendarIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Custo Médio</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(companiesData.stats.average_service_cost)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Lista de Empresas */}
                    <div className="lg:col-span-2">
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Empresas Encontradas ({companiesData?.companies?.length || 0})
                          </h3>
                        </div>

                        {companiesData.companies.length > 0 ? (
                          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                            {companiesData.companies.map((company) => (
                              <div
                                key={company.id}
                                onClick={() => selectCompany(company)}
                                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                                  selectedCompany?.id === company.id 
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                                    : ''
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">{company.name}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                      <span className="font-medium">CNPJ:</span> {company.cnpj || 'Não informado'}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                      <span className="font-medium">Cidade:</span> {company.city || 'Não informado'} - {company.state || 'N/A'}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                      <span className="font-medium">Total gasto:</span> {' '}
                                      <span className="font-bold text-green-600 dark:text-green-400">
                                        {formatCurrency(company.total_cost)}
                                      </span>
                                    </p>
                                  </div>
                                  {selectedCompany?.id === company.id && (
                                    <CheckCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                            <p>Nenhuma empresa encontrada</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Painel da Empresa Selecionada */}
                    <div className="lg:col-span-1">
                      {selectedCompany ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detalhes da Empresa</h3>
                          </div>
                          
                          <div className="p-6 space-y-6">
                            {/* Informações da Empresa */}
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Informações</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Nome:</span>
                                  <span className="text-gray-900 dark:text-white font-medium">{selectedCompany.name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">CNPJ:</span>
                                  <span className="text-gray-900 dark:text-white font-medium">{selectedCompany.cnpj || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Contato:</span>
                                  <span className="text-gray-900 dark:text-white font-medium">{selectedCompany.contact_person || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Telefone:</span>
                                  <span className="text-gray-900 dark:text-white font-medium">{selectedCompany.phone || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                                  <span className="text-gray-900 dark:text-white font-medium">{selectedCompany.email || 'N/A'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Estatísticas da Empresa */}
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Estatísticas Financeiras</h4>
                              <div className="grid grid-cols-1 gap-4">
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {selectedCompany.total_services}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Total de Serviços</div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(selectedCompany.total_cost)}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Custo Total</div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                    {formatCurrency(selectedCompany.average_cost)}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Custo Médio</div>
                                </div>
                              </div>
                            </div>

                            {/* Preview do Relatório */}
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Preview do Relatório</h4>
                              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <p>• Informações completas da empresa</p>
                                <p>• Histórico de serviços no período</p>
                                <p>• Estatísticas financeiras detalhadas</p>
                                <p>• Análise de desempenho</p>
                              </div>
                            </div>

                            {/* BOTÃO PDF */}
                            <button
                              onClick={generateCompanyPDF}
                              disabled={generatingPDF}
                              className={`w-full px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center ${
                                !generatingPDF
                                  ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
                                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                              {generatingPDF ? 'Gerando PDF...' : 'Gerar Relatório PDF'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                          <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                          <p className="text-gray-500 dark:text-gray-400">Selecione uma empresa para ver os detalhes</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Estado Inicial - Empresas */}
              {!hasSearched && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <BuildingOfficeIcon className="w-16 h-16 mx-auto mb-6 text-gray-300 dark:text-gray-600" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Bem-vindo aos Relatórios de Empresas</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Use os filtros acima para buscar empresas e gerar relatórios detalhados em PDF.
                  </p>
                  <button
                    onClick={searchCompanies}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
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