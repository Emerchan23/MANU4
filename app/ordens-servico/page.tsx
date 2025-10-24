'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { PrioritySelect, PriorityFilterSelect } from '@/components/ui/priority-select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Edit,
  Trash2,
  History,
  FileText,
  Users,
  Wrench,
  Download,
  FileDown,
  X,
  Ban
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  ServiceOrder, 
  Equipment, 
  Company, 
  User, 
  ServiceTemplate,
  MaintenanceHistory,
  MaintenanceSchedule,
  ServiceOrderFilters 
} from '@/types/service-orders'
import { DateInput } from "@/components/ui/date-input"
import { formatCurrency, parseCurrencyValue, applyCurrencyMask } from "@/lib/currency"
import { convertBRToISO, convertISOToBR } from "@/lib/date-utils"
import { formatMaintenanceType } from "@/lib/service-order-utils"
import { CompleteServiceButton } from "@/components/service-orders/complete-service-button"

export default function ServiceOrdersPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('list')
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [maintenanceTypes, setMaintenanceTypes] = useState<any[]>([])
  const [history, setHistory] = useState<MaintenanceHistory[]>([])
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<ServiceOrderFilters>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<ServiceOrder>>({})
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<ServiceOrder | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<ServiceOrder | null>(null)
  const [isCanceling, setIsCanceling] = useState(false)
  
  // Estados para filtros de setor e sub setor
  const [sectors, setSectors] = useState<any[]>([])
  const [subsectors, setSubsectors] = useState<any[]>([])
  const [sectorFilter, setSectorFilter] = useState<string>('')
  const [subsectorFilter, setSubsectorFilter] = useState<string>('')
  const [loadingSectors, setLoadingSectors] = useState(false)
  const [loadingSubsectors, setLoadingSubsectors] = useState(false)

  // Estados para filtros de histórico de manutenção
  const [equipmentNameFilter, setEquipmentNameFilter] = useState<string>('')
  const [patrimonyNumberFilter, setPatrimonyNumberFilter] = useState<string>('')
  const [historyLoading, setHistoryLoading] = useState(false)

  // useEffect para debounce dos filtros de histórico
  useEffect(() => {
    if (activeTab === 'history') {
      const timeoutId = setTimeout(() => {
        loadHistory()
      }, 500) // 500ms de delay

      return () => clearTimeout(timeoutId)
    }
  }, [equipmentNameFilter, patrimonyNumberFilter, activeTab])

  // Carregar dados iniciais
  useEffect(() => {
    console.log('🚀 useEffect executado - carregando dados iniciais');
    loadServiceOrders()
    loadEquipment()
    loadCompanies()
    loadUsers()
    loadMaintenanceTypes()
    loadSectors()
    console.log('🚀 Todas as funções de carregamento foram chamadas');
  }, [])

  useEffect(() => {
    console.log('🔍 useEffect maintenanceTypes - Estado atual:', maintenanceTypes);
    console.log('🔍 useEffect maintenanceTypes - Quantidade:', maintenanceTypes?.length || 0);
  }, [maintenanceTypes])
  // Debug: Monitorar mudanças no editFormData
  useEffect(() => {
    console.log('🔧 editFormData alterado:', editFormData);
    console.log('🔧 Campos específicos:');
    console.log('  - maintenance_type_id:', editFormData.maintenance_type_id, typeof editFormData.maintenance_type_id);
    console.log('  - scheduled_date:', editFormData.scheduled_date, typeof editFormData.scheduled_date);
    console.log('  - completion_date:', editFormData.completion_date, typeof editFormData.completion_date);
  }, [editFormData])

  // Debug: Monitorar mudanças no maintenanceTypes
  useEffect(() => {
    console.log('🔧 maintenanceTypes alterado:', maintenanceTypes);
    console.log('🔧 Quantidade de tipos:', maintenanceTypes?.length || 0);
  }, [maintenanceTypes])

  // Debug: Monitorar abertura do modal
  useEffect(() => {
    if (editModalOpen) {
      console.log('🔧 Modal de edição ABERTO');
      console.log('🔧 Estado atual dos dados:');
      console.log('  - maintenanceTypes:', maintenanceTypes);
      console.log('  - editFormData:', editFormData);
    } else {
      console.log('🔧 Modal de edição FECHADO');
    }
  }, [editModalOpen])

  const loadServiceOrders = async () => {
    setLoading(true)
    try {
      console.log('🔍 Iniciando carregamento das ordens de serviço...');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
        )
      })

      // Adicionar filtros de setor e sub setor
      if (sectorFilter) {
        params.append('sector_id', sectorFilter)
      }
      if (subsectorFilter) {
        params.append('subsector_id', subsectorFilter)
      }

      console.log('🔍 Parâmetros da requisição:', params.toString());
      const response = await fetch(`/api/service-orders?${params}`)
      console.log('🔍 Status da resposta:', response.status);
      
      const data = await response.json()
      console.log('🔍 Dados recebidos da API:', data);

      if (data.success) {
        console.log('🔍 Ordens de serviço carregadas:', data.data?.length || 0);
        setServiceOrders(data.data)
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        console.error('❌ Erro na API:', data.error);
        toast.error(data.error || 'Erro ao carregar ordens de serviço')
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      toast.error('Erro ao carregar ordens de serviço')
    } finally {
      setLoading(false)
    }
  }

  const loadEquipment = async () => {
    try {
      const response = await fetch('/api/equipment')
      const data = await response.json()
      if (data.success) {
        setEquipment(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error)
    }
  }

  const loadCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      const data = await response.json()
      if (data.success) {
        setCompanies(data.companies || data.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      // A API /api/users retorna um array diretamente, não um objeto com success
      if (Array.isArray(data)) {
        setUsers(data)
      } else {
        console.error('Formato inesperado da resposta da API users:', data)
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const loadMaintenanceTypes = async () => {
    try {
      console.log('🔍 Carregando tipos de manutenção...');
      const response = await fetch('/api/maintenance-types')
      const data = await response.json()
      console.log('🔍 Resposta da API maintenance-types:', data);
      
      if (data.success) {
        // Filtrar apenas os tipos ativos
        const activeTypes = data.data.filter((type: any) => type.isActive)
        console.log('🔍 Tipos ativos encontrados:', activeTypes);
        setMaintenanceTypes(activeTypes)
      } else {
        console.error('Erro ao carregar tipos de manutenção:', data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de manutenção:', error)
    }
  }

  const loadSectors = async () => {
    setLoadingSectors(true)
    try {
      const response = await fetch('/api/sectors')
      const data = await response.json()
      if (Array.isArray(data)) {
        setSectors(data)
      } else {
        console.error('Erro ao carregar setores:', data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar setores:', error)
    } finally {
      setLoadingSectors(false)
    }
  }

  const loadSubsectors = async (sectorId: string) => {
    setLoadingSubsectors(true)
    try {
      const response = await fetch(`/api/subsectors?sectorId=${sectorId}`)
      const data = await response.json()
      if (Array.isArray(data)) {
        setSubsectors(data)
      } else {
        console.error('Erro ao carregar subsetores:', data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar subsetores:', error)
    } finally {
      setLoadingSubsectors(false)
    }
  }

  const loadHistory = async (equipmentId?: number) => {
    try {
      setHistoryLoading(true)
      console.log('🔍 DEBUG - INÍCIO loadHistory - equipmentId:', equipmentId)
      console.log('🔍 DEBUG - Filtros:', { equipmentNameFilter, patrimonyNumberFilter })
      
      // Construir URL com parâmetros
      const params = new URLSearchParams()
      
      if (equipmentId) {
        params.append('equipmentId', equipmentId.toString())
      }
      
      if (equipmentNameFilter.trim()) {
        params.append('equipment_name', equipmentNameFilter.trim())
      }
      
      if (patrimonyNumberFilter.trim()) {
        params.append('patrimony_number', patrimonyNumberFilter.trim())
      }
      
      const url = `/api/service-orders/history?${params.toString()}`
      console.log('🔍 DEBUG - URL da requisição:', url)
      
      const response = await fetch(url)
      console.log('🔍 DEBUG - Response status:', response.status)
      
      const data = await response.json()
      console.log('🔍 DEBUG - Response data completa:', JSON.stringify(data, null, 2))
      
      if (data.success) {
        console.log('🔍 DEBUG - Histórico carregado com sucesso:', data.data.length, 'registros')
        setHistory(data.data)
      } else {
        console.error('🔍 DEBUG - Erro na resposta da API:', data.error)
        setHistory([])
      }
    } catch (error) {
      console.error('🔍 DEBUG - Erro na função loadHistory:', error)
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  // Função para abrir modal de edição
  const handleEditOrder = (order: ServiceOrder) => {
    console.log('🔍 DEBUG - Dados da ordem recebida:', order);
    console.log('🔍 DEBUG - Tipos de manutenção disponíveis:', maintenanceTypes);
    console.log('🔍 DEBUG - Quantidade de tipos disponíveis:', maintenanceTypes?.length || 0);
    
    // Debug detalhado dos campos relacionados ao tipo de manutenção
    console.log('🔍 DEBUG - Campos de tipo de manutenção na ordem:');
    console.log('  - order.maintenance_type_id:', order.maintenance_type_id, '(tipo:', typeof order.maintenance_type_id, ')');
    console.log('  - order.maintenance_type_name:', order.maintenance_type_name);
    console.log('  - order.maintenance_type:', order.maintenance_type);
    console.log('  - order.type:', (order as any).type);
    console.log('  - order.type_id:', (order as any).type_id);
    
    // Debug detalhado dos campos relacionados ao tipo de manutenção
    console.log('🔍 DEBUG - Campos de tipo de manutenção na ordem:');
    console.log('  - order.maintenance_type_id:', order.maintenance_type_id, '(tipo:', typeof order.maintenance_type_id, ')');
    console.log('  - order.maintenance_type_name:', order.maintenance_type_name);
    console.log('  - order.maintenance_type:', order.maintenance_type);
    console.log('  - order.type:', (order as any).type);
    console.log('  - order.type_id:', (order as any).type_id);
    
    // Se não há tipos de manutenção carregados, carregar primeiro
    if (!maintenanceTypes || maintenanceTypes.length === 0) {
      console.log('🔄 Carregando tipos de manutenção antes de abrir o modal...');
      loadMaintenanceTypes().then(() => {
        console.log('✅ Tipos carregados, abrindo modal novamente...');
        handleEditOrder(order); // Chamar recursivamente após carregar
      });
      return;
    }
    
    setSelectedOrder(order)
    
    // Tratar custo - usar 'cost' que é o campo real da tabela
    const costValue = (() => {
      const cost = (order as any).cost || order.estimated_cost;
      if (typeof cost === 'string') {
        return parseFloat(cost) || 0;
      }
      return cost || 0;
    })();
    
    // Tratar datas - converter para formato brasileiro (dd/mm/aaaa) para DateInput
    const scheduledDate = (() => {
      const date = order.scheduled_date;
      console.log('🔍 DEBUG - Processando scheduled_date:', date, typeof date);
      if (!date || date === '' || date === 'null' || date === null) return '';
      
      // Se for um objeto Date, converter para formato brasileiro
      if (date instanceof Date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const result = `${day}/${month}/${year}`;
        console.log('🔍 DEBUG - Date object convertido para:', result);
        return result;
      }
      
      // Se for string ISO datetime, converter para brasileiro
      if (typeof date === 'string' && date.includes('T')) {
        const dateObj = new Date(date);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        const result = `${day}/${month}/${year}`;
        console.log('🔍 DEBUG - ISO string convertido para:', result);
        return result;
      }
      
      // Se for string no formato yyyy-mm-dd, converter para brasileiro
      if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = date.split('-');
        const result = `${day}/${month}/${year}`;
        console.log('🔍 DEBUG - yyyy-mm-dd convertido para:', result);
        return result;
      }
      
      // Se já estiver no formato brasileiro, retornar como está
      if (typeof date === 'string' && date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        console.log('🔍 DEBUG - Já está em formato brasileiro:', date);
        return date;
      }
      
      console.log('🔍 DEBUG - Formato não reconhecido, retornando vazio');
      return '';
    })();
    
    const completionDate = (() => {
      const date = order.completion_date;
      console.log('🔍 DEBUG - Processando completion_date:', date, typeof date);
      if (!date || date === '' || date === 'null' || date === null) return '';
      
      // Se for um objeto Date, converter para formato brasileiro
      if (date instanceof Date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const result = `${day}/${month}/${year}`;
        console.log('🔍 DEBUG - Date object convertido para:', result);
        return result;
      }
      
      // Se for string ISO datetime, converter para brasileiro
      if (typeof date === 'string' && date.includes('T')) {
        const dateObj = new Date(date);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        const result = `${day}/${month}/${year}`;
        console.log('🔍 DEBUG - ISO string convertido para:', result);
        return result;
      }
      
      // Se for string no formato yyyy-mm-dd, converter para brasileiro
      if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = date.split('-');
        const result = `${day}/${month}/${year}`;
        console.log('🔍 DEBUG - yyyy-mm-dd convertido para:', result);
        return result;
      }
      
      // Se já estiver no formato brasileiro, retornar como está
      if (typeof date === 'string' && date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        console.log('🔍 DEBUG - Já está em formato brasileiro:', date);
        return date;
      }
      
      console.log('🔍 DEBUG - Formato não reconhecido, retornando vazio');
      return '';
    })();
    
    // Tratar maintenance_type_id - pode estar em diferentes campos
    const maintenanceTypeId = order.maintenance_type_id || (order as any).type_id || (order as any).maintenance_type_id;
    console.log('🔍 DEBUG - Processando maintenance_type_id:', maintenanceTypeId, typeof maintenanceTypeId);
    
    // Implementar mapeamento inteligente para corrigir IDs incompatíveis
    let finalMaintenanceTypeId = maintenanceTypeId;
    
    if (maintenanceTypeId) {
      // Primeiro, verificar se o ID existe na lista atual
      const foundType = maintenanceTypes.find(type => type.id === maintenanceTypeId || type.id === parseInt(maintenanceTypeId));
      
      if (foundType) {
        console.log('✅ DEBUG - Tipo encontrado na lista:', `${foundType.id} - ${foundType.name}`);
        finalMaintenanceTypeId = foundType.id;
      } else {
        console.log('❌ DEBUG - Tipo NÃO ENCONTRADO na lista. Tentando mapear pelo nome...');
        console.log('🔍 DEBUG - maintenance_type_name da ordem:', order.maintenance_type_name);
        
        // Mapear pelo nome do tipo de manutenção
        const typeNameMapping = {
          'PREVENTIVA': 1,
          'CORRETIVA': 2, 
          'PREDITIVA': 3,
          'CALIBRAÇÃO': 4,
          'CONSULTORIA': 7
        };
        
        const typeName = order.maintenance_type_name?.toUpperCase();
        if (typeName && typeNameMapping[typeName]) {
          finalMaintenanceTypeId = typeNameMapping[typeName];
          console.log(`✅ DEBUG - Mapeamento por nome: "${typeName}" → ID ${finalMaintenanceTypeId}`);
        } else {
          // Tentar encontrar por similaridade de nome
          const similarType = maintenanceTypes.find(type => 
            type.name.toUpperCase().includes(typeName) || 
            typeName?.includes(type.name.toUpperCase())
          );
          
          if (similarType) {
            finalMaintenanceTypeId = similarType.id;
            console.log(`✅ DEBUG - Mapeamento por similaridade: "${typeName}" → ID ${finalMaintenanceTypeId} (${similarType.name})`);
          } else {
            // Fallback para Preventiva (ID 1)
            finalMaintenanceTypeId = 1;
            console.log(`⚠️ DEBUG - Fallback aplicado: usando ID 1 (Preventiva) para "${typeName}"`);
          }
        }
        
        console.log('🔍 DEBUG - Tipos disponíveis na lista:');
        maintenanceTypes.forEach(type => {
          console.log(`  - ID: ${type.id} (${typeof type.id}) - Nome: ${type.name}`);
        });
      }
    } else {
      console.log('⚠️ DEBUG - maintenance_type_id está vazio/nulo!');
      finalMaintenanceTypeId = 1; // Fallback para Preventiva
    }
    
    console.log('🎯 DEBUG - ID final após mapeamento:', finalMaintenanceTypeId, typeof finalMaintenanceTypeId);
    
    console.log('🔍 DEBUG - Dados originais da API:', {
      'order.maintenance_type_id': order.maintenance_type_id,
      'order.scheduled_date': order.scheduled_date,
      'order.completion_date': order.completion_date,
      'order.cost': (order as any).cost,
      'order.priority': order.priority,
      'order.status': order.status
    });
    
    console.log('🔧 DEBUG - Processamento dos campos problemáticos:');
    console.log('- maintenanceTypeId processado:', maintenanceTypeId, typeof maintenanceTypeId);
    console.log('- scheduledDate processado:', scheduledDate, typeof scheduledDate);
    console.log('- completionDate processado:', completionDate, typeof completionDate);
    
    const formData = {
      id: order.id,
      equipment_id: order.equipment_id,
      company_id: order.company_id,
      maintenance_type: order.maintenance_type,
      maintenance_type_id: finalMaintenanceTypeId, // Usando o ID mapeado corretamente
      description: order.description,
      priority: order.priority,
      status: order.status,
      estimated_cost: costValue, // Agora usando o campo 'cost' real da tabela
      actual_cost: order.actual_cost,
      scheduled_date: scheduledDate,
      completion_date: completionDate,
      assigned_to: order.assigned_to,
      template_id: order.template_id,
      observations: order.observations
    };
    
    console.log('🔍 DEBUG - FormData final que será setado:', formData);
    console.log('🔍 DEBUG - Especificamente o maintenance_type_id no formData:', formData.maintenance_type_id, typeof formData.maintenance_type_id);
    
    setEditFormData(formData)
    setEditModalOpen(true)
  }

  // Função para salvar edição
  const handleSaveEdit = async () => {
    if (!selectedOrder) return

    try {
      // Mapear os campos para o formato esperado pela API (baseado na estrutura real da tabela)
      const requestData = {
        equipmentId: editFormData.equipment_id,
        companyId: editFormData.company_id,
        description: editFormData.description,
        priority: editFormData.priority,
        status: editFormData.status,
        cost: editFormData.estimated_cost, // A tabela usa 'cost' ao invés de 'estimated_cost'
        scheduledDate: editFormData.scheduled_date,
        completionDate: editFormData.completion_date,
        observations: editFormData.observations,
        assignedTo: editFormData.assigned_to,
        maintenanceTypeId: editFormData.maintenance_type_id // Usar o ID do tipo de manutenção
      }

      const response = await fetch(`/api/service-orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Ordem de serviço atualizada com sucesso!')
        setEditModalOpen(false)
        loadServiceOrders() // Recarregar lista
      } else {
        toast.error(data.error || 'Erro ao atualizar ordem de serviço')
      }
    } catch (error) {
      toast.error('Erro ao atualizar ordem de serviço')
    }
  }

  // Função para gerar arquivo
  const handleGeneratePDF = async (order: ServiceOrder) => {
    try {
      toast.loading('Gerando PDF...', { id: 'pdf-generation' })

      const response = await fetch(`/api/pdf/new-download/${order.id}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `OS-${order.order_number}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success('PDF gerado com sucesso!', { id: 'pdf-generation' })
      } else {
        toast.error('Erro ao gerar PDF', { id: 'pdf-generation' })
      }
    } catch (error) {
      toast.error('Erro ao gerar PDF', { id: 'pdf-generation' })
    }
  }

  // Função para excluir ordem de serviço
  const handleDeleteOrder = (order: ServiceOrder) => {
    setOrderToDelete(order)
    setDeleteModalOpen(true)
  }

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/service-orders/${orderToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Ordem de serviço excluída com sucesso!')
        setDeleteModalOpen(false)
        setOrderToDelete(null)
        loadServiceOrders() // Recarregar lista
      } else {
        toast.error(data.error || 'Erro ao excluir ordem de serviço')
      }
    } catch (error) {
      toast.error('Erro ao excluir ordem de serviço')
    } finally {
      setIsDeleting(false)
    }
  }

  // Função para concluir ordem de serviço
  const handleCompleteService = async (orderId: number) => {
    console.log('✅ Ordem concluída com sucesso, ID:', orderId)
    // Recarregar a lista para atualizar o status
    await loadServiceOrders()
  }

  // Função para cancelar ordem de serviço
  const handleCancelOrder = (order: ServiceOrder) => {
    setOrderToCancel(order)
    setCancelModalOpen(true)
  }

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return

    setIsCanceling(true)
    try {
      const response = await fetch(`/api/service-orders/${orderToCancel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CANCELADA'
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        toast.success('Ordem de serviço cancelada com sucesso!')
        setCancelModalOpen(false)
        setOrderToCancel(null)
        loadServiceOrders() // Recarregar lista
      } else {
        toast.error(data.error || 'Erro ao cancelar ordem de serviço')
      }
    } catch (error) {
      console.error('Erro ao cancelar ordem:', error)
      toast.error('Erro ao cancelar ordem de serviço')
    } finally {
      setIsCanceling(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      // Status do banco de dados (português)
      'aberta': { 
        label: 'Aberta', 
        className: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200' 
      },
      'em_andamento': { 
        label: 'Em Andamento', 
        className: 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200' 
      },
      'concluida': { 
        label: 'Concluída', 
        className: 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200' 
      },
      'cancelada': { 
        label: 'Cancelada', 
        className: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200' 
      },
      // Status em inglês (compatibilidade)
      'pending': { 
        label: 'Pendente', 
        className: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200' 
      },
      'in_progress': { 
        label: 'Em Andamento', 
        className: 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200' 
      },
      'completed': { 
        label: 'Concluída', 
        className: 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200' 
      },
      'cancelled': { 
        label: 'Cancelada', 
        className: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200' 
      }
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { 
      label: status || 'Indefinido', 
      className: 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200' 
    }
    
    return (
      <Badge 
        variant="outline" 
        className={`font-medium ${statusInfo.className}`}
      >
        {statusInfo.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      low: { label: 'Baixa', variant: 'secondary' as const },
      medium: { label: 'Média', variant: 'default' as const },
      high: { label: 'Alta', variant: 'destructive' as const }
    }
    
    const priorityInfo = priorityMap[priority as keyof typeof priorityMap] || { label: priority, variant: 'secondary' as const }
    return <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ordens de Serviço</h1>
            <p className="text-muted-foreground">
              Gerencie ordens de serviço, histórico e agendamentos
            </p>
          </div>
          <Button 
            onClick={() => router.push('/ordens-servico/nova')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Ordem
          </Button>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Ordens de Serviço
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <Input
                    id="search"
                    placeholder="Número, equipamento, empresa..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={filters.status || ''}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all-status' ? undefined : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-status">Todos os status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <PriorityFilterSelect
                    value={filters.priority || 'all-priorities'}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value === 'all-priorities' ? undefined : value }))}
                    variant="service-order"
                    placeholder="Todas as prioridades"
                  />
                </div>
              </div>

              {/* Segunda linha de filtros */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Combobox
                    value={filters.companyId?.toString() || ''}
                    onValueChange={(value) => setFilters(prev => ({ 
                      ...prev, 
                      companyId: value === 'all' || !value ? undefined : parseInt(value) 
                    }))}
                    options={[
                      { value: 'all', label: 'Todas as empresas' },
                      ...(companies && companies.length > 0 ? companies.map((company) => ({
                        value: company.id.toString(),
                        label: `${company.name}${company.cnpj ? ` - ${company.cnpj}` : ''}`
                      })) : [])
                    ]}
                    placeholder="Buscar por nome ou CNPJ..."
                    searchPlaceholder="Buscar por nome ou CNPJ..."
                    emptyText="Nenhuma empresa encontrada"
                    allowCustomValue={false}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sector">Setor</Label>
                  <Combobox
                    value={sectorFilter}
                    onValueChange={(value) => {
                      setSectorFilter(value === 'all' ? '' : value)
                      // Limpar sub setor quando setor mudar
                      if (value !== sectorFilter) {
                        setSubsectorFilter('')
                        setSubsectors([])
                      }
                      // Carregar sub setores se um setor foi selecionado
                      if (value && value !== 'all') {
                        loadSubsectors(value)
                      }
                    }}
                    options={[
                      { value: 'all', label: 'Todos os setores' },
                      ...(sectors && sectors.length > 0 ? sectors.map((sector) => ({
                        value: sector.id.toString(),
                        label: sector.name
                      })) : [])
                    ]}
                    placeholder="Selecione o setor..."
                    searchPlaceholder="Buscar setor..."
                    emptyText="Nenhum setor encontrado"
                    allowCustomValue={false}
                    disabled={loadingSectors}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subsector">Sub Setor</Label>
                  <Combobox
                    value={subsectorFilter}
                    onValueChange={(value) => {
                      setSubsectorFilter(value === 'all' ? '' : value)
                    }}
                    options={[
                      { value: 'all', label: 'Todos os sub setores' },
                      ...(subsectors && subsectors.length > 0 ? subsectors.map((subsector) => ({
                        value: subsector.id.toString(),
                        label: subsector.name
                      })) : [])
                    ]}
                    placeholder="Selecione o sub setor..."
                    searchPlaceholder="Buscar sub setor..."
                    emptyText={sectorFilter ? "Nenhum sub setor encontrado" : "Selecione um setor primeiro"}
                    allowCustomValue={false}
                    disabled={loadingSubsectors || !sectorFilter}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button onClick={loadServiceOrders} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? 'Buscando...' : 'Buscar'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilters({})
                    setSectorFilter('')
                    setSubsectorFilter('')
                    setSubsectors([])
                    setCurrentPage(1)
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Ordens de Serviço */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p>Carregando ordens de serviço...</p>
              </div>
            ) : serviceOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma ordem de serviço encontrada</p>
              </div>
            ) : (
              serviceOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-4">
                          <h3 className="text-lg font-semibold">{order.order_number}</h3>
                          {getStatusBadge(order.status)}
                          {getPriorityBadge(order.priority)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <p><strong>Equipamento:</strong> {order.equipment_name} - {order.equipment_model}</p>
                          <p><strong>Empresa:</strong> {order.company_name}</p>
                          <p><strong>Tipo:</strong> {order.maintenance_type_name || 'Não informado'}</p>
                          {order.scheduled_date && (
                            <p><strong>Agendado para:</strong> {order.scheduled_date}</p>
                          )}
                          {order.assigned_to_name && (
                            <p><strong>Responsável:</strong> {order.assigned_to_name}</p>
                          )}
                        </div>
                        
                        <p className="text-sm">{order.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Custo estimado: {formatCurrency(order.cost || 0)}</span>
                          <span>Criado em: {order.created_at}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditOrder(order)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleGeneratePDF(order)}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <FileDown className="h-4 w-4 mr-1" />
                          OS
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log('🔍 DEBUG - Botão histórico clicado!')
                            console.log('🔍 DEBUG - order.equipment_id:', order.equipment_id)
                            console.log('🔍 DEBUG - Tipo do equipment_id:', typeof order.equipment_id)
                            console.log('🔍 DEBUG - Ordem completa:', order)
                            loadHistory(order.equipment_id)
                            setActiveTab('history')
                            console.log('🔍 DEBUG - Tab alterada para history')
                          }}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <CompleteServiceButton
                          orderId={order.id}
                          orderNumber={order.order_number}
                          equipmentName={order.equipment_name}
                          currentStatus={order.status}
                          onComplete={handleCompleteService}
                        />
                        {(order.status === 'ABERTA' || order.status === 'AGENDADA') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelOrder(order)}
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteOrder(order)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Histórico de Manutenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filtros de Busca */}
              <div className="mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="equipment-name-filter">Nome do Equipamento</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="equipment-name-filter"
                        placeholder="Buscar por nome do equipamento..."
                        value={equipmentNameFilter}
                        onChange={(e) => setEquipmentNameFilter(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patrimony-filter">Número de Patrimônio</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="patrimony-filter"
                        placeholder="Buscar por número de patrimônio..."
                        value={patrimonyNumberFilter}
                        onChange={(e) => setPatrimonyNumberFilter(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEquipmentNameFilter('')
                      setPatrimonyNumberFilter('')
                    }}
                    disabled={!equipmentNameFilter && !patrimonyNumberFilter}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                  {historyLoading && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Buscando...
                    </div>
                  )}
                </div>
              </div>
              {history.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>Nenhum histórico encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item, index) => (
                    <div key={item.id} className="border-l-2 border-blue-200 pl-4 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{item.order_number}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.equipment_name} - {item.company_name}
                          </p>
                          <p className="text-sm mt-1">{item.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <span>Executado em: {item.execution_date}</span>
                            <span>Por: {item.performed_by_name}</span>
                            {item.cost > 0 && <span>Custo: {formatCurrency(item.cost)}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>

      {/* Modal de Edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Ordem de Serviço</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Equipamento e Empresa */}
            {/* Campo Equipamento - Linha separada */}
            <div className="space-y-2 relative">
              <Label htmlFor="edit-equipment">Equipamento</Label>
              <div className="relative z-10">
                <Combobox
                  options={equipment && equipment.length > 0 ? equipment.map((eq) => ({
                    value: eq.id.toString(),
                    label: `${eq.name}${eq.patrimonio_number ? ` - ${eq.patrimonio_number}` : ''}${eq.sector_name ? ` (${eq.sector_name})` : ''}`
                  })) : []}
                  value={editFormData.equipment_id?.toString() || ''}
                  onValueChange={(value) => setEditFormData(prev => ({ 
                    ...prev, 
                    equipment_id: parseInt(value) 
                  }))}
                  placeholder="Selecione o equipamento"
                  searchPlaceholder="Buscar por nome ou patrimônio..."
                  emptyText="Nenhum equipamento encontrado"
                  allowCustomValue={false}
                />
              </div>
            </div>
            
            {/* Campo Empresa - Linha separada */}
            <div className="space-y-2">
              <Label htmlFor="edit-company">Empresa</Label>
              <Combobox
                value={editFormData.company_id?.toString() || ''}
                onValueChange={(value) => setEditFormData(prev => ({ 
                  ...prev, 
                  company_id: parseInt(value) 
                }))}
                options={companies && companies.length > 0 ? companies.map((company) => ({
                  value: company.id.toString(),
                  label: `${company.name}${company.cnpj ? ` - ${company.cnpj}` : ''}`
                })) : []}
                placeholder="Selecione a empresa"
                searchPlaceholder="Buscar por nome ou CNPJ..."
                emptyText="Nenhuma empresa encontrada"
                allowCustomValue={false}
              />
            </div>

            {/* Tipo de Manutenção */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-maintenance-type">Tipo de Manutenção</Label>
                <Select
                  key={`maintenance-${editFormData.maintenance_type_id}-${maintenanceTypes?.length || 0}`}
                  value={editFormData.maintenance_type_id?.toString() || ''}
                  onValueChange={(value) => {
                    console.log('🔧 Alterando maintenance_type_id para:', value, 'tipo:', typeof value);
                    const numericValue = parseInt(value);
                    console.log('🔧 Valor numérico convertido:', numericValue);
                    setEditFormData(prev => ({ ...prev, maintenance_type_id: numericValue }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue 
                      placeholder="Selecione o tipo"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {maintenanceTypes && maintenanceTypes.length > 0 ? (
                      maintenanceTypes.map((type) => {
                        const isSelected = type.id === editFormData.maintenance_type_id || type.id.toString() === editFormData.maintenance_type_id?.toString();
                        console.log(`🔧 DEBUG - Tipo ${type.name} (ID: ${type.id}): selecionado = ${isSelected}`);
                        return (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem value="none" disabled>
                        Nenhum tipo disponível
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                {/* Espaço vazio para manter o layout */}
              </div>
            </div>

            {/* Prioridade e Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Prioridade</Label>
                <PrioritySelect
                  key={`priority-${editFormData.priority}`}
                  value={editFormData.priority || ''}
                  onValueChange={(value) => {
                    console.log('🔧 Alterando priority para:', value);
                    setEditFormData(prev => ({ ...prev, priority: value as any }));
                  }}
                  variant="service-order"
                  placeholder="Selecione a prioridade"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  key={`status-${editFormData.status}`}
                  value={editFormData.status || ''}
                  onValueChange={(value) => {
                    console.log('🔧 Alterando status para:', value);
                    setEditFormData(prev => ({ ...prev, status: value as any }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ABERTA">Aberta</SelectItem>
                    <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                    <SelectItem value="AGUARDANDO_APROVACAO">Aguardando Aprovação</SelectItem>
                    <SelectItem value="APROVADA">Aprovada</SelectItem>
                    <SelectItem value="REJEITADA">Rejeitada</SelectItem>
                    <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                    <SelectItem value="CANCELADA">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Custo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-cost">Custo</Label>
                <Input
                  id="edit-cost"
                  type="text"
                  placeholder="R$ 0,00"
                  value={editFormData.estimated_cost > 0 ? formatCurrency(editFormData.estimated_cost) : ''}
                  onChange={(e) => {
                    const inputValue = e.target.value
                    console.log('🔧 Input original:', inputValue);
                    
                    // Aplica máscara de moeda em tempo real
                    const maskedValue = applyCurrencyMask(inputValue)
                    const numericValue = parseCurrencyValue(maskedValue)
                    
                    console.log('🔧 Valor mascarado:', maskedValue);
                    console.log('🔧 Valor numérico:', numericValue);
                    
                    // Atualiza o valor do input com a máscara (igual ao formulário de criação)
                    e.target.value = maskedValue
                    
                    setEditFormData(prev => ({ 
                      ...prev, 
                      estimated_cost: numericValue
                    }))
                  }}
                />
              </div>
              
              <div className="space-y-2">
                {/* Espaço vazio para manter o layout */}
              </div>
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-scheduled">Data Agendada</Label>
                <DateInput
                  id="edit-scheduled"
                  key={`scheduled-${editFormData.scheduled_date}`}
                  value={editFormData.scheduled_date || ''}
                  onChange={(value) => {
                    console.log('🔧 DateInput scheduled_date onChange:', value);
                    setEditFormData(prev => ({ 
                      ...prev, 
                      scheduled_date: value
                    }))
                  }}
                  placeholder="dd/mm/aaaa"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-completion">Data de Conclusão</Label>
                <DateInput
                  id="edit-completion"
                  key={`completion-${editFormData.completion_date}`}
                  value={editFormData.completion_date || ''}
                  onChange={(value) => {
                    console.log('🔧 DateInput completion_date onChange:', value);
                    setEditFormData(prev => ({ 
                      ...prev, 
                      completion_date: value
                    }))
                  }}
                  placeholder="dd/mm/aaaa"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-assigned">Responsável</Label>
              <Select
                value={editFormData.assigned_to?.toString() || ''}
                onValueChange={(value) => setEditFormData(prev => ({ 
                  ...prev, 
                  assigned_to: value === 'none' ? undefined : parseInt(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">Nenhum responsável</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description || ''}
                onChange={(e) => setEditFormData(prev => ({ 
                  ...prev, 
                  description: e.target.value 
                }))}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-observations">Observações</Label>
              <Textarea
                id="edit-observations"
                value={editFormData.observations || ''}
                onChange={(e) => setEditFormData(prev => ({ 
                  ...prev, 
                  observations: e.target.value 
                }))}
                rows={2}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a ordem de serviço &quot;{orderToDelete?.order_number}&quot;?
              Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteOrder}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Confirmação de Cancelamento */}
      <AlertDialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar a ordem de serviço &quot;{orderToCancel?.order_number}&quot;?
              Esta ação alterará o status da ordem para &quot;CANCELADA&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCanceling}>
              Não Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelOrder}
              disabled={isCanceling}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isCanceling ? 'Cancelando...' : 'Cancelar Ordem'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </MainLayout>
  )
}