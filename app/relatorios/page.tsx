'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, DocumentArrowDownIcon, ChartBarIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { MainLayout } from '@/components/layout/main-layout'

interface Equipment {
  id: number
  name: string
  code: string
  model: string
  manufacturer: string
  sector_name: string
}

interface Company {
  id: number
  name: string
  cnpj: string
  contact_email: string
}

interface MaintenanceRecord {
  id: number
  date: string
  type: string
  description: string
  status: string
  technician_name: string
  cost: number
  company_name?: string
}

interface EquipmentStats {
  totalMaintenances: number
  totalCost: number
  averageRepairTime: number
  successRate: number
}

interface CompanyStats {
  totalSpent: number
  totalServices: number
  averageCostPerService: number
  equipmentCount: number
  activePeriod: string
  successRate: number
}

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState<'equipamentos' | 'empresas'>('equipamentos')
  const [equipmentSearch, setEquipmentSearch] = useState('')
  const [companySearch, setCompanySearch] = useState('')
  const [equipmentSuggestions, setEquipmentSuggestions] = useState<Equipment[]>([])
  const [companySuggestions, setCompanySuggestions] = useState<Company[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([])
  const [equipmentStats, setEquipmentStats] = useState<EquipmentStats | null>(null)
  const [companyStats, setCompanyStats] = useState<CompanyStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [showEquipmentSuggestions, setShowEquipmentSuggestions] = useState(false)
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false)

  // Equipment search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (equipmentSearch.length >= 2) {
        searchEquipment(equipmentSearch)
      } else {
        setEquipmentSuggestions([])
        setShowEquipmentSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [equipmentSearch])

  // Company search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (companySearch.length >= 2) {
        searchCompany(companySearch)
      } else {
        setCompanySuggestions([])
        setShowCompanySuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [companySearch])

  const searchEquipment = async (query: string) => {
    try {
      const response = await fetch(`/api/relatorios/equipment/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setEquipmentSuggestions(data)
        setShowEquipmentSuggestions(true)
      }
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error)
    }
  }

  const searchCompany = async (query: string) => {
    try {
      const response = await fetch(`/api/relatorios/companies/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setCompanySuggestions(data)
        setShowCompanySuggestions(true)
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
    }
  }

  const selectEquipment = async (equipment: Equipment) => {
    setSelectedEquipment(equipment)
    setEquipmentSearch(equipment.name)
    setShowEquipmentSuggestions(false)
    setLoading(true)

    try {
      // Fetch maintenance history
      const historyResponse = await fetch(`/api/relatorios/equipment/${equipment.id}/history`)
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setMaintenanceHistory(historyData)
      }

      // Fetch equipment statistics
      const statsResponse = await fetch(`/api/relatorios/equipment/${equipment.id}/stats`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setEquipmentStats(statsData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do equipamento:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectCompany = async (company: Company) => {
    setSelectedCompany(company)
    setCompanySearch(company.name)
    setShowCompanySuggestions(false)
    setLoading(true)

    try {
      // Fetch company statistics and services
      const statsResponse = await fetch(`/api/relatorios/companies/${company.id}/stats`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setCompanyStats(statsData.stats)
        setMaintenanceHistory(statsData.services)
      }
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async () => {
    if (activeTab === 'equipamentos' && selectedEquipment) {
      try {
        const response = await fetch(`/api/relatorios/equipment/${selectedEquipment.id}/pdf`, {
          method: 'POST'
        })
        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `relatorio-equipamento-${selectedEquipment.code}.pdf`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      } catch (error) {
        console.error('Erro ao gerar PDF:', error)
      }
    } else if (activeTab === 'empresas' && selectedCompany) {
      try {
        const response = await fetch(`/api/relatorios/companies/${selectedCompany.id}/pdf`, {
          method: 'POST'
        })
        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `relatorio-empresa-${selectedCompany.name.replace(/\s+/g, '-')}.pdf`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      } catch (error) {
        console.error('Erro ao gerar PDF:', error)
      }
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatórios de Manutenção</h1>
            <p className="text-gray-600">Consulte o histórico de manutenções e gere relatórios detalhados</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('equipamentos')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'equipamentos'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <ChartBarIcon className="w-5 h-5 inline mr-2" />
                  Equipamentos
                </button>
                <button
                  onClick={() => setActiveTab('empresas')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'empresas'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <BuildingOfficeIcon className="w-5 h-5 inline mr-2" />
                  Empresas
                </button>
              </nav>
            </div>
          </div>

        {/* Equipment Tab */}
        {activeTab === 'equipamentos' && (
          <div className="space-y-6">
            {/* Equipment Search */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Buscar Equipamento</h2>
              <div className="relative">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Digite o nome do equipamento ou patrimônio..."
                    value={equipmentSearch}
                    onChange={(e) => setEquipmentSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Equipment Suggestions */}
                {showEquipmentSuggestions && equipmentSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {equipmentSuggestions.map((equipment) => (
                      <button
                        key={equipment.id}
                        onClick={() => selectEquipment(equipment)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                      >
                        <div className="font-medium text-gray-900">{equipment.name}</div>
                        <div className="text-sm text-gray-500">
                          {equipment.code} - {equipment.manufacturer} - {equipment.sector_name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Equipment Statistics */}
            {selectedEquipment && equipmentStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <ChartBarIcon className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total de Manutenções</p>
                      <p className="text-2xl font-semibold text-gray-900">{equipmentStats.totalMaintenances}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold">R$</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Custo Total</p>
                      <p className="text-2xl font-semibold text-gray-900">{formatCurrency(equipmentStats.totalCost)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 font-bold">⏱</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Tempo Médio</p>
                      <p className="text-2xl font-semibold text-gray-900">{equipmentStats.averageRepairTime}h</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-bold">✓</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Taxa de Sucesso</p>
                      <p className="text-2xl font-semibold text-gray-900">{equipmentStats.successRate}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Maintenance History Table */}
            {selectedEquipment && maintenanceHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Histórico de Manutenções</h3>
                  <button
                    onClick={generatePDF}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                    Gerar PDF
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Técnico</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {maintenanceHistory.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(record.date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.type}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{record.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              record.status === 'CONCLUIDA' ? 'bg-green-100 text-green-800' :
                              record.status === 'EM_ANDAMENTO' ? 'bg-yellow-100 text-yellow-800' :
                              record.status === 'CANCELADA' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.technician_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(record.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === 'empresas' && (
          <div className="space-y-6">
            {/* Company Search */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Buscar Empresa</h2>
              <div className="relative">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Digite o nome da empresa ou CNPJ..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Company Suggestions */}
                {showCompanySuggestions && companySuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {companySuggestions.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => selectCompany(company)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                      >
                        <div className="font-medium text-gray-900">{company.name}</div>
                        <div className="text-sm text-gray-500">
                          CNPJ: {company.cnpj} - {company.contact_email}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Company Statistics */}
            {selectedCompany && companyStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold">R$</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Gasto</p>
                      <p className="text-2xl font-semibold text-gray-900">{formatCurrency(companyStats.totalSpent)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <ChartBarIcon className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Serviços Realizados</p>
                      <p className="text-2xl font-semibold text-gray-900">{companyStats.totalServices}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 font-bold">⚡</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Média por Serviço</p>
                      <p className="text-2xl font-semibold text-gray-900">{formatCurrency(companyStats.averageCostPerService)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-bold">🔧</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Equipamentos Atendidos</p>
                      <p className="text-2xl font-semibold text-gray-900">{companyStats.equipmentCount}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-bold">📅</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Período de Atuação</p>
                      <p className="text-lg font-semibold text-gray-900">{companyStats.activePeriod}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold">✓</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Taxa de Sucesso</p>
                      <p className="text-2xl font-semibold text-gray-900">{companyStats.successRate}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Company Services Table */}
            {selectedCompany && maintenanceHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Serviços Realizados</h3>
                  <button
                    onClick={generatePDF}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                    Gerar PDF
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipamento</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {maintenanceHistory.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(record.date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.technician_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.type}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{record.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              record.status === 'CONCLUIDA' ? 'bg-green-100 text-green-800' :
                              record.status === 'EM_ANDAMENTO' ? 'bg-yellow-100 text-yellow-800' :
                              record.status === 'CANCELADA' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(record.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Carregando dados...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !selectedEquipment && !selectedCompany && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <MagnifyingGlassIcon />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {activeTab === 'equipamentos' ? 'Nenhum equipamento selecionado' : 'Nenhuma empresa selecionada'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'equipamentos' 
                ? 'Busque por um equipamento para visualizar seu histórico de manutenções'
                : 'Busque por uma empresa para visualizar seus relatórios financeiros'
              }
            </p>
          </div>
        )}
        </div>
      </div>
    </MainLayout>
  )
}