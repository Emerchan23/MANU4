// Types and interfaces for preventive maintenance system

// Maintenance Status Types
export type MaintenanceStatus = 
  | "SCHEDULED" 
  | "IN_PROGRESS" 
  | "COMPLETED" 
  | "OVERDUE" 
  | "CANCELLED"

// Maintenance Priority Types
export type MaintenancePriority = 
  | "CRITICAL" 
  | "HIGH" 
  | "MEDIUM" 
  | "LOW"

// Maintenance Frequency Types
export type MaintenanceFrequency = 
  | "DAILY"
  | "WEEKLY" 
  | "MONTHLY" 
  | "QUARTERLY" 
  | "SEMI_ANNUAL"
  | "ANNUAL"

// Maintenance Type Categories
export type MaintenanceType = 
  | "INSPECTION"
  | "CALIBRATION" 
  | "CLEANING"
  | "REPAIR"
  | "REPLACEMENT"
  | "TESTING"

// Main PreventiveMaintenance interface
export interface PreventiveMaintenance {
  id: string | number
  planId?: string | number
  equipmentId: string | number
  equipmentName: string
  equipmentCode?: string
  sectorId?: string | number
  sectorName?: string
  title?: string
  planName?: string
  description?: string
  frequency: MaintenanceFrequency
  maintenanceType?: MaintenanceType
  type?: MaintenanceType
  priority: MaintenancePriority
  status: MaintenanceStatus
  scheduledDate?: string | Date
  nextDueDate?: string | Date
  scheduled_date?: string | Date
  next_due_date?: string | Date
  completedDate?: string | Date
  estimatedDuration: number
  estimated_duration?: number
  actualDuration?: number
  estimatedCost?: number
  estimated_cost?: number
  actualCost?: number
  assignedTechnicianId?: string | number
  assignedTechnicianName?: string
  assigned_technician_name?: string
  notes?: string
  tasks?: MaintenanceTask[]
  createdAt?: string | Date
  updatedAt?: string | Date
  createdBy?: string
  updatedBy?: string
  // Additional fields for compatibility
  equipment_name?: string
  equipment_code?: string
  sector_name?: string
}

// Maintenance Task interface
export interface MaintenanceTask {
  id: string
  name: string
  description: string
  estimatedDuration: number
  requiredTools: string[]
  requiredParts: string[]
  instructions?: string
  safetyNotes?: string
  isCompleted?: boolean
  completedAt?: string | Date
  completedBy?: string
  notes?: string
}

// Maintenance Plan interface
export interface MaintenancePlan {
  id: string
  name: string
  description: string
  equipmentType: string
  frequency: MaintenanceFrequency
  tasks: MaintenanceTask[]
  estimatedDuration: number
  estimatedCost?: number
  isActive: boolean
  createdAt: Date
  updatedAt?: Date
  createdBy: string
  updatedBy?: string
}

// Constants for status labels
export const MAINTENANCE_STATUSES: Record<MaintenanceStatus, string> = {
  SCHEDULED: "Agendada",
  IN_PROGRESS: "Em Andamento", 
  COMPLETED: "Concluída",
  OVERDUE: "Atrasada",
  CANCELLED: "Cancelada"
}

// Constants for priority labels
export const MAINTENANCE_PRIORITIES: Record<MaintenancePriority, string> = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Média", 
  LOW: "Baixa"
}

// Constants for frequency labels
export const MAINTENANCE_FREQUENCIES: Record<MaintenanceFrequency, string> = {
  DAILY: "Diária",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
  SEMI_ANNUAL: "Semestral",
  ANNUAL: "Anual"
}

// Constants for maintenance type labels
export const MAINTENANCE_TYPES: Record<MaintenanceType, string> = {
  INSPECTION: "Inspeção",
  CALIBRATION: "Calibração",
  CLEANING: "Limpeza", 
  REPAIR: "Reparo",
  REPLACEMENT: "Substituição",
  TESTING: "Teste"
}

// Helper type for API responses
export interface PreventiveMaintenanceResponse {
  success: boolean
  data?: PreventiveMaintenance | PreventiveMaintenance[]
  error?: string
  message?: string
  total?: number
  page?: number
  limit?: number
}

// Helper type for filters
export interface PreventiveMaintenanceFilters {
  status?: MaintenanceStatus | string
  priority?: MaintenancePriority | string
  equipmentId?: string | number
  sectorId?: string | number
  frequency?: MaintenanceFrequency | string
  dateFrom?: string | Date
  dateTo?: string | Date
  search?: string
  page?: number
  limit?: number
}