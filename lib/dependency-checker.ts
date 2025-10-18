// Sistema de verificação de dependências para exclusões guiadas
export interface DependencyCheck {
  canDelete: boolean
  blockedBy: DependencyBlock[]
  cascadeDeletes?: CascadeDelete[]
}

export interface DependencyBlock {
  type: string
  items: Array<{
    id: string
    name: string
    description?: string
  }>
  message: string
  actionRequired: string
}

export interface CascadeDelete {
  type: string
  count: number
  items: Array<{
    id: string
    name: string
  }>
}

// Função para buscar dados reais do banco de dados
async function fetchServiceOrdersByEquipment(equipmentId: string) {
  try {
    const response = await fetch(`/api/service-orders?equipmentId=${equipmentId}`)
    if (response.ok) {
      const data = await response.json()
      return data.success ? data.data : []
    }
  } catch (error) {
    console.error('Erro ao buscar ordens de serviço:', error)
  }
  return []
}

async function fetchMaintenanceSchedulesByEquipment(equipmentId: string) {
  try {
    const response = await fetch(`/api/maintenance-schedules?equipmentId=${equipmentId}`)
    if (response.ok) {
      const data = await response.json()
      return data.success ? data.data : []
    }
  } catch (error) {
    console.error('Erro ao buscar agendamentos de manutenção:', error)
  }
  return []
}

async function fetchEquipmentsByCompany(companyId: string) {
  try {
    const response = await fetch(`/api/equipment?companyId=${companyId}`)
    if (response.ok) {
      const data = await response.json()
      return data.success ? data.data : []
    }
  } catch (error) {
    console.error('Erro ao buscar equipamentos da empresa:', error)
  }
  return []
}

async function fetchServiceOrdersByUser(userId: string) {
  try {
    const response = await fetch(`/api/service-orders?userId=${userId}`)
    if (response.ok) {
      const data = await response.json()
      return data.success ? data.data : []
    }
  } catch (error) {
    console.error('Erro ao buscar ordens de serviço do usuário:', error)
  }
  return []
}

export async function checkEquipmentDependencies(equipmentId: string): Promise<DependencyCheck> {
  const serviceOrders = await fetchServiceOrdersByEquipment(equipmentId)
  const maintenanceSchedules = await fetchMaintenanceSchedulesByEquipment(equipmentId)

  const blockedBy: DependencyBlock[] = []

  if (serviceOrders.length > 0) {
    blockedBy.push({
      type: "service_orders",
      items: serviceOrders.map((os) => ({
        id: os.id,
        name: os.name,
        description: `Status: ${os.status}`,
      })),
      message: `Este equipamento não pode ser excluído, pois está vinculado a ${serviceOrders.length} ordem(ns) de serviço.`,
      actionRequired: `Para excluir, primeiro finalize ou cancele as ordens de serviço: ${serviceOrders.map((os) => os.id).join(", ")}.`,
    })
  }

  if (maintenanceSchedules.length > 0) {
    blockedBy.push({
      type: "maintenance_schedules",
      items: maintenanceSchedules.map((ms) => ({
        id: ms.id,
        name: ms.name,
      })),
      message: `Este equipamento possui ${maintenanceSchedules.length} agendamento(s) de manutenção preventiva.`,
      actionRequired: `Cancele ou transfira os agendamentos antes de excluir o equipamento.`,
    })
  }

  return {
    canDelete: blockedBy.length === 0,
    blockedBy,
  }
}

export async function checkCompanyDependencies(companyId: string): Promise<DependencyCheck> {
  const equipments = await fetchEquipmentsByCompany(companyId)

  const blockedBy: DependencyBlock[] = []

  if (equipments.length > 0) {
    blockedBy.push({
      type: "equipments",
      items: equipments.map((eq) => ({
        id: eq.id,
        name: eq.name,
      })),
      message: `Esta empresa não pode ser excluída, pois possui vínculo com ${equipments.length} equipamento(s).`,
      actionRequired: `Exclua ou transfira os equipamentos antes: ${equipments.map((eq) => eq.name).join(", ")}.`,
    })
  }

  return {
    canDelete: blockedBy.length === 0,
    blockedBy,
  }
}

export async function checkUserDependencies(userId: string): Promise<DependencyCheck> {
  const allServiceOrders = await fetchServiceOrdersByUser(userId)
  const serviceOrders = allServiceOrders.filter((os: any) => os.status === "EM_ANDAMENTO")

  const blockedBy: DependencyBlock[] = []

  if (serviceOrders.length > 0) {
    blockedBy.push({
      type: "service_orders",
      items: serviceOrders.map((os) => ({
        id: os.id,
        name: os.name,
        description: `Status: ${os.status}`,
      })),
      message: `O usuário não pode ser excluído, pois é responsável por ${serviceOrders.length} ordem(ns) de serviço em andamento.`,
      actionRequired: `Finalize ou reatribua essas OS antes de excluir o usuário: ${serviceOrders.map((os) => os.id).join(", ")}.`,
    })
  }

  return {
    canDelete: blockedBy.length === 0,
    blockedBy,
  }
}

export function checkSectorDependencies(sectorId: string): DependencyCheck {
  // Simular equipamentos no setor
  const equipmentsInSector = 3
  const subsectorsCount = 2

  const cascadeDeletes: CascadeDelete[] = []

  if (subsectorsCount > 0) {
    cascadeDeletes.push({
      type: "subsectors",
      count: subsectorsCount,
      items: [
        { id: "SUB-001", name: "UTI Adulto" },
        { id: "SUB-002", name: "UTI Pediátrica" },
      ],
    })
  }

  return {
    canDelete: true,
    blockedBy: [],
    cascadeDeletes,
  }
}
