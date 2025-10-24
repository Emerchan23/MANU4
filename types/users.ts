export type UserRole = "ADMIN" | "GESTOR" | "TECNICO" | "USUARIO"

export interface User {
  id: string
  username: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  sector_name?: string
  created_at?: string
}