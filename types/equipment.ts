// Tipos para equipamentos
export interface Equipment {
  id?: number;
  name: string;
  patrimonio?: string;
  patrimonio_number?: string;
  model?: string;
  serial_number?: string;
  manufacturer?: string;
  sector_id?: number;
  category_id?: number;
  subsector_id?: number;
  installation_date?: string;
  last_preventive_maintenance?: string;
  next_preventive_maintenance?: string;
  maintenance_frequency_days?: number;
  warranty_expiry?: string;
  status?: string;
  observations?: string;
  created_at?: string;
  updated_at?: string;
  voltage?: string;
  power?: string;
  maintenance_frequency?: string;
  // Campos relacionados (joins)
  sector_name?: string;
  category_name?: string;
  subsector_name?: string;
}

export interface EquipmentFormData {
  patrimonio_number: string;
  name: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  category_id: number;
  sector_id: number;
  subsector_id: number;
  installation_date: string;
  maintenance_frequency_days: number;
  observations: string;
  voltage: string;
  status: string;
}