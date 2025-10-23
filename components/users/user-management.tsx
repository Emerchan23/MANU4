"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { UserPlusIcon, PencilIcon, TrashIcon, UserIcon, ShieldCheckIcon } from "@heroicons/react/24/outline"
import type { User, UserRole } from "@/types/users"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const AVAILABLE_SECTORS = [
  { id: "1", name: "UTI" },
  { id: "2", name: "Emergencia" },
  { id: "3", name: "Centro Cirurgico" },
  { id: "4", name: "Radiologia" },
  { id: "5", name: "Laboratorio" },
]

const USER_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: "ADMIN", label: "Administrador", description: "Acesso total ao sistema" },
  { value: "GESTOR", label: "Gestor", description: "Acesso a todas as abas exceto Configuracoes" },
  { value: "TECNICO", label: "Tecnico", description: "Acesso limitado para tecnicos" },
  { value: "USUARIO", label: "Usuario", description: "Acesso basico limitado" },
]

interface UserFormData {
  name: string
  email: string
  username: string
  password: string
  newPassword?: string
  role: UserRole
  allowedSectors: string[]
  isActive: boolean
}

// Funções de formatação e validação
const formatName = (value: string): string => {
  // Remove caracteres que não são letras, espaços ou acentos
  const cleanValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '')
  
  // Capitaliza a primeira letra de cada palavra
  return cleanValue.replace(/\b\w/g, (char) => char.toUpperCase())
}



export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    username: "",
    password: "",
    role: "USUARIO",
    allowedSectors: [],
    isActive: true,
  })

  // Load users from API on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/users', {
          credentials: 'include' // Include cookies for session-based auth
        })

        if (response.ok) {
          const usersData = await response.json()
          setUsers(usersData)
        } else {
          console.error('Erro ao carregar usuarios:', response.statusText)
        }
      } catch (error) {
        console.error('Erro na requisicao:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      username: "",
      password: "",
      newPassword: "",
      role: "USUARIO",
      allowedSectors: [],
      isActive: true,
    })
    setEditingUser(null)
  }

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        username: user.username, // Show username in edit mode
        password: "",
        newPassword: "",
        role: user.role,
        allowedSectors: user.allowedSectors,
        isActive: user.isActive,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  const handleSectorChange = (sectorId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      allowedSectors: checked
        ? [...prev.allowedSectors, sectorId]
        : prev.allowedSectors.filter((id) => id !== sectorId),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingUser) {
        // Update existing user
        const updateData = { ...formData }
        
        // Only include password if newPassword is provided
        if (formData.newPassword && formData.newPassword.trim() !== "") {
          updateData.password = formData.newPassword
        } else {
          // Remove password field if no new password provided
          delete updateData.password
        }
        
        // Remove newPassword field as it's not needed in the API
        delete updateData.newPassword
        
        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include', // Include cookies for session-based auth
          body: JSON.stringify(updateData)
        })

        if (response.ok) {
          const updatedUser = await response.json()
          setUsers((prev) =>
            prev.map((user) => (user.id === editingUser.id ? updatedUser : user))
          )
        } else {
          const error = await response.json()
          alert(`Erro ao atualizar usuario: ${error.error || error.message}`)
          return
        }
      } else {
        // Create new user
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include', // Include cookies for session-based auth
          body: JSON.stringify(formData)
        })

        if (response.ok) {
          const newUser = await response.json()
          setUsers((prev) => [...prev, newUser])
        } else {
          const error = await response.json()
          alert(`Erro ao criar usuario: ${error.message}`)
          return
        }
      }

      handleCloseDialog()
    } catch (error) {
      console.error('Erro na requisicao:', error)
      alert('Erro de conexao. Tente novamente.')
    }
  }

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setDeleteModalOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return
    
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include' // Include cookies for session-based auth
      })

      if (response.ok) {
        const result = await response.json()
        setUsers((prev) => prev.filter((user) => user.id !== userToDelete.id))
        alert(result.message || 'Usuário excluído com sucesso!')
      } else {
        const error = await response.json()
        
        if (response.status === 409) {
          // Erro de conflito - usuário possui vínculos
          const errorMessage = `${error.message}\n\n${error.details}\n\n${error.suggestion}`
          alert(errorMessage)
        } else {
          // Outros erros
          alert(`Erro ao excluir usuário: ${error.error || error.message || 'Erro desconhecido'}`)
        }
      }
    } catch (error) {
      console.error('Erro na requisição:', error)
      alert('Erro de conexão. Tente novamente.')
    } finally {
      setIsDeleting(false)
      setDeleteModalOpen(false)
      setUserToDelete(null)
    }
  }

  const toggleUserStatus = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies for session-based auth
        body: JSON.stringify({ ...user, isActive: !user.isActive })
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUsers((prev) =>
          prev.map((user) => (user.id === userId ? updatedUser : user))
        )
      } else {
        const error = await response.json()
        alert(`Erro ao alterar status do usuario: ${error.message}`)
      }
    } catch (error) {
      console.error('Erro na requisicao:', error)
      alert('Erro de conexao. Tente novamente.')
    }
  }

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "default"
      case "GESTOR":
        return "secondary"
      case "TECNICO":
        return "outline"
      case "USUARIO":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Gestao de Usuarios
              </CardTitle>
              <CardDescription>Gerencie usuarios do sistema e suas permissoes</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  Novo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingUser ? "Editar Usuario" : "Novo Usuario"}</DialogTitle>
                  <DialogDescription>
                    {editingUser ? "Edite as informacoes do usuario" : "Preencha os dados para criar um novo usuario"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => {
                            const formattedName = formatName(e.target.value)
                            setFormData((prev) => ({ ...prev, name: formattedName }))
                          }}
                          placeholder="Digite apenas letras e espaços"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, email: e.target.value.toLowerCase().trim() }))
                          }}
                          placeholder="exemplo@email.com"
                          required
                        />
                      </div>
                    </div>

                    {!editingUser ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="username">Usuario</Label>
                          <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) => {
                              // Remove espaços e caracteres especiais, permitir apenas letras, números e underscore
                              const cleanValue = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()
                              setFormData((prev) => ({ ...prev, username: cleanValue }))
                            }}
                            placeholder="usuario123"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Senha</Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editUsername">Usuario</Label>
                          <Input
                            id="editUsername"
                            value={formData.username}
                            onChange={(e) => {
                              // Remove espaços e caracteres especiais, permitir apenas letras, números e underscore
                              const cleanValue = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()
                              setFormData((prev) => ({ ...prev, username: cleanValue }))
                            }}
                            placeholder="usuario123"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">Nova Senha (deixe em branco para manter atual)</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={formData.newPassword || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="Digite a nova senha ou deixe em branco"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="role">Perfil de Acesso</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value: UserRole) => setFormData((prev) => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {USER_ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              <div className="flex flex-col">
                                <span>{role.label}</span>
                                <span className="text-xs text-muted-foreground">{role.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.role !== "ADMIN" && (
                      <div className="space-y-3">
                        <Label>Setores Permitidos</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {AVAILABLE_SECTORS.map((sector) => (
                            <div key={sector.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`sector-${sector.id}`}
                                checked={formData.allowedSectors.includes(sector.id)}
                                onCheckedChange={(checked) => handleSectorChange(sector.id, checked as boolean)}
                              />
                              <Label htmlFor={`sector-${sector.id}`} className="text-sm">
                                {sector.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                        {(formData.role as string) !== "ADMIN" && formData.allowedSectors.length === 0 && (
                          <Alert>
                            <ShieldCheckIcon className="h-4 w-4" />
                            <AlertDescription>
                              Selecione pelo menos um setor para usuarios nao-administradores.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit">{editingUser ? "Salvar Alteracoes" : "Criar Usuario"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Setores</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      <span className="ml-2">Carregando usuarios...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum usuario encontrado
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {USER_ROLES.find((r) => r.value === user.role)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.role === "ADMIN" ? (
                        <Badge variant="outline">Todos</Badge>
                      ) : user.allowedSectors.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.allowedSectors.map((sectorId) => {
                            const sector = AVAILABLE_SECTORS.find((s) => s.id === sectorId)
                            return sector ? (
                              <Badge key={sectorId} variant="outline" className="text-xs">
                                {sector.name}
                              </Badge>
                            ) : null
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Nenhum</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => toggleUserStatus(user.id)}>
                          {user.isActive ? "Desativar" : "Ativar"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(user)}>
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário "{userToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser} 
              disabled={isDeleting} 
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
