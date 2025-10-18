// Types and interfaces for Maintenance Scheduling System

// Maintenance Plan Types
export type MaintenanceFrequency = 
  | "DAILY"
  | "WEEKLY" 
  | "MONTHLY" 
  | "QUARTERLY" 
  | "SEMIANNUAL"
  | "ANNUAL"

export type MaintenanceType = 
  | "PREVENTIVE"
  | "CORRECTIVE" 
  | "PREDICTIVE"

// Schedule Status Types
export type ScheduleStatus = 
  | "SCHEDULED"
  | "IN_PROGRESS" 
  | "COMPLETED" 
  | "OVERDUE"
  | "CANCELLED"

// Priority Types
export type MaintenancePriority = 
  | "LOW"
  | "MEDIUM" 
  | "HIGH" 
  | "CRITICAL"

// Maintenance Plan Interface
export interface MaintenancePlan {
  id: string
  name: string
  description?: string
  frequency: MaintenanceFrequency
  maintenance_type: MaintenanceType
  estimated_duration: number // minutes
  estimated_cost: number
  is_active: boolean
  equipment_ids: string[] // JSON array of equipment IDs
  created_at: string
  updated_at: string
}

// Maintenance Schedule Interface
export interface MaintenanceSchedule {
  id: string
  plan_id?: string
  equipment_id: string
  scheduled_date: string
  status: ScheduleStatus
  priority: MaintenancePriority
  assigned_to?: string
  notes?: string
  completed_at?: string
  actual_duration?: number
  actual_cost?: number
  completion_notes?: string
  created_at: string
  updated_at: string
  // Joined fields
  plan_name?: string
  equipment_name?: string
  equipment_code?: string
  equipment_patrimonio_number?: string
  sector_name?: string
  subsector_name?: string
  assigned_technician_name?: string
}

// Maintenance History Interface
export interface MaintenanceHistory {
  id: string
  schedule_id: string
  equipment_id: string
  execution_date: string
  duration_minutes: number
  cost: number
  notes?: string
  completed_tasks: MaintenanceTaskCompletion[]
  photos: string[]
  executed_by?: string
  created_at: string
  // Joined fields
  equipment_name?: string
  equipment_code?: string
  executed_by_name?: string
}

// Maintenance Task Interface
export interface MaintenanceTask {
  id: string
  plan_id: string
  task_name: string
  description?: string
  is_required: boolean
  order_sequence: number
  created_at: string
}

// Task Completion Interface
export interface MaintenanceTaskCompletion {
  task_id: string
  task_name: string
  is_completed: boolean
  notes?: string
  completed_at?: string
}

// Dashboard Metrics Interface
export interface MaintenanceDashboard {
  pending_count: number
  overdue_count: number
  completed_this_month: number
  completion_rate: number
  upcoming_7_days: MaintenanceSchedule[]
  overdue_schedules: MaintenanceSchedule[]
  monthly_stats: {
    month: string
    scheduled: number
    completed: number
    overdue: number
  }[]
  cost_analysis: {
    estimated_total: number
    actual_total: number
    variance: number
  }
}

// API Response Types
export interface MaintenancePlansResponse {
  success: boolean
  data: MaintenancePlan[]
  total?: number
  page?: number
  limit?: number
  error?: string
}

export interface MaintenanceSchedulesResponse {
  success: boolean
  data: MaintenanceSchedule[]
  total?: number
  page?: number
  limit?: number
  error?: string
}

export interface MaintenanceDashboardResponse {
  success: boolean
  data: MaintenanceDashboard
  error?: string
}

// Filter Types
export interface MaintenancePlanFilters {
  search?: string
  frequency?: MaintenanceFrequency
  maintenance_type?: MaintenanceType
  is_active?: boolean
  page?: number
  limit?: number
}

export interface MaintenanceScheduleFilters {
  start_date?: string
  end_date?: string
  equipment_id?: string
  status?: ScheduleStatus
  priority?: MaintenancePriority
  assigned_to?: string
  plan_id?: string
  page?: number
  limit?: number
}

// Form Types
export interface CreateMaintenancePlanForm {
  name: string
  description?: string
  frequency: MaintenanceFrequency
  maintenance_type: MaintenanceType
  estimated_duration: number
  estimated_cost: number
  equipment_ids: string[]
  tasks: Omit<MaintenanceTask, 'id' | 'plan_id' | 'created_at'>[]
}

export interface CreateMaintenanceScheduleForm {
  plan_id?: string
  equipment_id: string
  scheduled_date: string
  priority: MaintenancePriority
  assigned_to?: string
  notes?: string
}

export interface CompleteMaintenanceForm {
  completed_tasks: MaintenanceTaskCompletion[]
  actual_duration: number
  actual_cost?: number
  completion_notes?: string
  photos?: string[]
}

// Constants for labels
export const MAINTENANCE_FREQUENCIES: Record<MaintenanceFrequency, string> = {
  DAILY: "Diário",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  ANNUAL: "Anual"
}

export const MAINTENANCE_TYPES: Record<MaintenanceType, string> = {
  PREVENTIVE: "Preventiva",
  CORRECTIVE: "Corretiva",
  PREDICTIVE: "Preditiva"
}

export const SCHEDULE_STATUSES: Record<ScheduleStatus, string> = {
  SCHEDULED: "Agendado",
  IN_PROGRESS: "Em Andamento",
  COMPLETED: "Concluído",
  OVERDUE: "Atrasado",
  CANCELLED: "Cancelado"
}

export const MAINTENANCE_PRIORITIES: Record<MaintenancePriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica"
}

// Utility Types
export type MaintenancePlanCreate = Omit<MaintenancePlan, 'id' | 'created_at' | 'updated_at'>
export type MaintenanceScheduleCreate = Omit<MaintenanceSchedule, 'id' | 'created_at' | 'updated_at'>
export type MaintenanceScheduleUpdate = Partial<Omit<MaintenanceSchedule, 'id' | 'created_at'>>