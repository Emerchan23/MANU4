import { z } from "zod";

// Schema de validação para Company
export const CompanySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Nome da empresa é obrigatório").max(255, "Nome muito longo"),
  cnpj: z.string()
    .min(1, "CNPJ é obrigatório")
    .regex(/^\d{14}$/, "CNPJ deve conter 14 dígitos"),
  contact_person: z.string().min(1, "Pessoa de contato é obrigatória").max(255, "Nome muito longo"),
  phone: z.string()
    .min(1, "Telefone é obrigatório")
    .regex(/^\d{10,11}$/, "Telefone deve conter 10 ou 11 dígitos"),
  email: z.string()
    .min(1, "E-mail é obrigatório")
    .email("E-mail deve ser válido")
    .max(255, "E-mail muito longo"),
  address: z.string().min(1, "Endereço é obrigatório"),
  specialties: z.string().min(1, "Especialidades são obrigatórias"),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Schema para criação (sem ID)
export const CreateCompanySchema = CompanySchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

// Schema para atualização (ID obrigatório)
export const UpdateCompanySchema = CompanySchema.omit({ 
  created_at: true, 
  updated_at: true 
}).extend({
  id: z.number().min(1, "ID é obrigatório para atualização")
});

// Tipos TypeScript derivados dos schemas
export type Company = z.infer<typeof CompanySchema>;
export type CreateCompany = z.infer<typeof CreateCompanySchema>;
export type UpdateCompany = z.infer<typeof UpdateCompanySchema>;

// Tipo para resposta da API de listagem
export interface CompaniesResponse {
  companies: Company[];
  total: number;
  page: number;
  totalPages: number;
}

// Tipo para resposta da API de operações
export interface CompanyApiResponse {
  success: boolean;
  company?: Company;
  message: string;
}

// Utilitários para formatação
export const formatCNPJ = (cnpj: string): string => {
  const numbers = cnpj.replace(/\D/g, '');
  
  // Aplica a máscara progressivamente
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 5) {
    return numbers.replace(/(\d{2})(\d+)/, '$1.$2');
  } else if (numbers.length <= 8) {
    return numbers.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
  } else if (numbers.length <= 12) {
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
  } else {
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, '$1.$2.$3/$4-$5');
  }
};

export const formatPhone = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');
  
  // Aplica a máscara progressivamente
  if (numbers.length <= 2) {
    return numbers.length > 0 ? `(${numbers}` : numbers;
  } else if (numbers.length <= 6) {
    return numbers.replace(/(\d{2})(\d+)/, '($1) $2');
  } else if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
  } else {
    return numbers.replace(/(\d{2})(\d{5})(\d+)/, '($1) $2-$3');
  }
};

export const removeCNPJMask = (cnpj: string): string => {
  return cnpj.replace(/\D/g, '');
};

export const removePhoneMask = (phone: string): string => {
  return phone.replace(/\D/g, '');
};