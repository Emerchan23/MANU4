"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, X } from "lucide-react"
import { toast } from "sonner"
import { formatDateBR } from "@/lib/date-utils"
import type { Equipment } from "@/types/equipment"

interface AlertFormData {
  tipo: string
  equipmentId: string
  dataVencimento: string
  prioridade: string
  descricao: string
  observacoes?: string
  notificados: string[]
}

export default function NovoAlertaPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState<AlertFormData>({
    tipo: "",
    equipmentId: "",
    dataVencimento: "",
    prioridade: "MEDIA",
    descricao: "",
    observacoes: "",
    notificados: [],
  })
  
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [users, setUsers] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEquipments = async () => {
    try {
      const response = await fetch('/api/equipment')
      if (!response.ok) throw new Error('Erro ao carregar equipamentos')
      
      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setEquipments(data.data)
      } else {
        throw new Error('Formato de resposta inválido')
      }
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error)
      setError('Erro ao carregar equipamentos')
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Erro ao carregar usuários')
      
      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        const userEmails = data.data.map((user: any) => user.email).filter(Boolean)
        setUsers(userEmails)
      } else {
        // Se não conseguir carregar usuários, usar lista padrão
        setUsers([
          'admin@empresa.com',
          'manutencao@empresa.com',
          'supervisor@empresa.com',
          'tecnico1@empresa.com',
          'tecnico2@empresa.com'
        ])
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      // Usar lista padrão em caso de erro
      setUsers([
        'admin@empresa.com',
        'manutencao@empresa.com',
        'supervisor@empresa.com',
        'tecnico1@empresa.com',
        'tecnico2@empresa.com'
      ])
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchEquipments(), fetchUsers()])
      setLoading(false)
    }
    
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação básica
    if (!formData.tipo || !formData.equipmentId || !formData.dataVencimento || !formData.descricao) {
      toast.error('Por favor, preencha todos os campos obrigatórios')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar alerta')
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success('Alerta criado com sucesso!')
        router.push('/alertas')
      } else {
        throw new Error(result.error || 'Erro ao criar alerta')
      }
    } catch (error) {
      console.error('Erro ao criar alerta:', error)
      toast.error('Erro ao criar alerta. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addEmail = () => {
    if (newEmail && !formData.notificados.includes(newEmail)) {
      setFormData({
        ...formData,
        notificados: [...formData.notificados, newEmail],
      })
      setNewEmail("")
    }
  }

  const removeEmail = (email: string) => {
    setFormData({
      ...formData,
      notificados: formData.notificados.filter((e) => e !== email),
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>Carregando formulário...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb e Título */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/alertas')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <nav className="text-sm text-muted-foreground mb-1">
            Alertas &gt; Novo Alerta
          </nav>
          <h1 className="text-2xl font-bold">Criar Novo Alerta</h1>
        </div>
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Alerta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Alerta *</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUTENCAO">Manutenção</SelectItem>
                  <SelectItem value="CALIBRACAO">Calibração</SelectItem>
                  <SelectItem value="GARANTIA">Garantia</SelectItem>
                  <SelectItem value="INSPECAO">Inspeção</SelectItem>
                  <SelectItem value="LIMPEZA">Limpeza</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Equipamento */}
            <div className="space-y-2">
              <Label htmlFor="equipmentId">Equipamento *</Label>
              <Select value={formData.equipmentId} onValueChange={(value) => setFormData({ ...formData, equipmentId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {equipments.map((equipment) => (
                    <SelectItem key={equipment.id} value={equipment.id.toString()}>
                      {equipment.name} - {equipment.patrimonio_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data de Vencimento */}
            <div className="space-y-2">
              <Label htmlFor="dataVencimento">Data de Vencimento *</Label>
              <DateInput
                id="dataVencimento"
                placeholder="dd/mm/aaaa"
                value={formData.dataVencimento}
                onChange={(value) => setFormData({ ...formData, dataVencimento: value })}
                required
              />
            </div>

            {/* Prioridade */}
            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select value={formData.prioridade} onValueChange={(value) => setFormData({ ...formData, prioridade: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAIXA">Baixa</SelectItem>
                  <SelectItem value="MEDIA">Média</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="CRITICA">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o alerta..."
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                required
                rows={4}
              />
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações adicionais (opcional)..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Usuários Notificados */}
            <div className="space-y-2">
              <Label>Usuários Notificados</Label>
              <div className="flex gap-2">
                <Select value={newEmail} onValueChange={setNewEmail}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((user) => !formData.notificados.includes(user))
                      .map((user) => (
                        <SelectItem key={user} value={user}>
                          {user}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addEmail} disabled={!newEmail}>
                  Adicionar
                </Button>
              </div>
              
              {formData.notificados.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.notificados.map((email) => (
                    <Badge key={email} variant="secondary" className="flex items-center gap-1">
                      {email}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => removeEmail(email)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/alertas')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Criando...' : 'Criar Alerta'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}