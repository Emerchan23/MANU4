"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeftIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline"
import type { SectorWithSubsectors, Subsector } from "@/types/sectors"

interface SectorFormProps {
  sector?: SectorWithSubsectors | null
  onSubmit: (sector: Omit<SectorWithSubsectors, "id" | "createdAt" | "updatedAt">) => void
  onCancel: () => void
}

export function SectorForm({ sector, onSubmit, onCancel }: SectorFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    responsible: "",
  })

  const [subsectors, setSubsectors] = useState<Omit<Subsector, "sectorId">[]>([])

  useEffect(() => {
    if (sector) {
      setFormData({
        name: sector.name,
        description: sector.description,
        responsible: sector.responsible,
      })
      setSubsectors(
        sector.subsectors.map((sub) => ({
          id: sub.id,
          name: sub.name,
          description: sub.description,
        })),
      )
    }
  }, [sector])

  const handleAddSubsector = () => {
    setSubsectors([
      ...subsectors,
      {
        id: Date.now().toString(),
        name: "",
        description: "",
      },
    ])
  }

  const handleUpdateSubsector = (index: number, field: keyof Omit<Subsector, "sectorId">, value: string) => {
    const updated = [...subsectors]
    updated[index] = { ...updated[index], [field]: value }
    setSubsectors(updated)
  }

  const handleRemoveSubsector = (index: number) => {
    setSubsectors(subsectors.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validar campos obrigatórios do setor
    if (!formData.name.trim()) {
      alert("O nome do setor é obrigatório")
      return
    }

    if (!formData.responsible.trim()) {
      alert("O responsável pelo setor é obrigatório")
      return
    }

    // Filtrar subsetores válidos (com nome preenchido)
    const validSubsectors = subsectors.filter((sub) => sub.name.trim())
    
    // Validar se há subsetores com nome vazio (apenas avisar, não bloquear)
    const invalidSubsectors = subsectors.filter((sub) => !sub.name.trim())
    if (invalidSubsectors.length > 0) {
      const confirmSubmit = confirm(
        `Existem ${invalidSubsectors.length} subsetor(es) com nome vazio que serão ignorados. Deseja continuar?`
      )
      if (!confirmSubmit) {
        return
      }
    }

    onSubmit({
      name: formData.name,
      description: formData.description,
      responsible: formData.responsible,
      subsectors: validSubsectors.map((sub) => ({
        ...sub,
        sectorId: sector?.id || "",
      })),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{sector ? "Editar Setor" : "Novo Setor"}</h1>
          <p className="text-muted-foreground">
            {sector ? "Atualize as informações do setor" : "Cadastre um novo setor no sistema"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Setor</CardTitle>
            <CardDescription>Dados básicos do setor hospitalar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Setor *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: UTI"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsible">Responsável *</Label>
                <Input
                  id="responsible"
                  value={formData.responsible}
                  onChange={(e) => setFormData((prev) => ({ ...prev, responsible: e.target.value }))}
                  placeholder="Ex: Dr. João Silva"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição detalhada do setor"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Subsetores</CardTitle>
                <CardDescription>Configure os subsetores vinculados a este setor</CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={handleAddSubsector}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Adicionar Subsetor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {subsectors.length > 0 ? (
              <div className="space-y-4">
                {subsectors.map((subsector, index) => (
                  <div key={subsector.id} className="p-4 border border-border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Subsetor {index + 1}</h4>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveSubsector(index)}>
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`subsector-name-${index}`}>Nome *</Label>
                        <Input
                          id={`subsector-name-${index}`}
                          value={subsector.name}
                          onChange={(e) => handleUpdateSubsector(index, "name", e.target.value)}
                          placeholder="Ex: UTI Adulto"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`subsector-description-${index}`}>Descrição</Label>
                        <Input
                          id={`subsector-description-${index}`}
                          value={subsector.description}
                          onChange={(e) => handleUpdateSubsector(index, "description", e.target.value)}
                          placeholder="Descrição do subsetor"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum subsetor adicionado</p>
                <Button type="button" variant="outline" className="mt-2 bg-transparent" onClick={handleAddSubsector}>
                  Adicionar primeiro subsetor
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">{sector ? "Atualizar" : "Cadastrar"} Setor</Button>
        </div>
      </form>
    </div>
  )
}
