export interface ServiceOrder {
  id: number
  order_number: string
  equipment_id: number
  company_id: number
  maintenance_type: 'preventive' | 'corrective' | 'other'
  maintenance_type_id?: number
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  estimated_cost: number | string
  actual_cost?: number
  scheduled_date?: string
  completion_date?: string
  observations?: string
  template_id?: number
  created_by: number
  assigned_to?: number
  created_at: string
  updated_at: string
  
  // Relacionamentos
  equipment_name?: string
  equipment_model?: string
  equipment_serial?: string
  company_name?: string
  company_phone?: string
  created_by_name?: string
  assigned_to_name?: string
  template_name?: string
  description_template?: string
  
  // Histórico
  history?: MaintenanceHistory[]
}

export interface MaintenanceHistory {
  id: number
  service_order_id: number
  description: string
  execution_date: string
  performed_by: number
  cost: number
  observations?: string
  created_by: number
  created_at: string
  updated_at: string
  
  // Relacionamentos
  order_number?: string
  maintenance_type?: string
  priority?: string
  order_status?: string
  equipment_name?: string
  equipment_model?: string
  company_name?: string
  performed_by_name?: string
  created_by_name?: string
}

export interface MaintenanceSchedule {
  id: number
  equipment_id: number
  maintenance_type: 'preventive' | 'corrective' | 'other'
  description: string
  scheduled_date: string
  completion_date?: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'completed' | 'cancelled'
  assigned_to?: number
  recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  recurrence_interval: number
  parent_schedule_id?: number
  created_by: number
  created_at: string
  updated_at: string
  
  // Relacionamentos
  equipment_name?: string
  equipment_model?: string
  equipment_serial?: string
  company_name?: string
  created_by_name?: string
  assigned_to_name?: string
  
  // Status calculado
  is_overdue?: boolean
}

export interface ServiceTemplate {
  id: number
  category_id: number
  name: string
  description_template: string
  maintenance_type: 'preventive' | 'corrective' | 'other'
  estimated_cost: number
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Relacionamentos
  category_name?: string
  category_description?: string
}

export interface TemplateCategory {
  id: number
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Equipment {
  id: number
  name: string
  model?: string
  serial_number?: string
  company_id: number
  sector_id?: number
  category_id?: number
  status: 'active' | 'inactive' | 'maintenance'
  
  // Relacionamentos
  company_name?: string
  sector_name?: string
  category_name?: string
}

export interface Company {
  id: number
  name: string
  contact_phone?: string
  contact_email?: string
  address?: string
}

export interface User {
  id: number
  name: string
  email?: string
  role?: string
}

export interface ServiceOrderFilters {
  status?: string
  priority?: string
  maintenanceType?: string
  companyId?: number
  equipmentId?: number
  assignedTo?: number
  startDate?: string
  endDate?: string
  search?: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: PaginationInfo
}