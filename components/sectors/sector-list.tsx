"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, MapIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import { SectorForm } from "./sector-form"
import { checkSectorDependencies } from "@/lib/dependency-checker"
import { DependencyDialog } from "@/components/ui/dependency-dialog"
import { useSectors } from "@/hooks/useSectors"
import type { SectorWithSubsectors } from "@/types/sectors"
import type { DependencyCheck } from "@/lib/dependency-checker"

export function SectorList() {
  const { sectors, loading, error, refetch } = useSectors()
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingSector, setEditingSector] = useState<SectorWithSubsectors | null>(null)
  const [dependencyCheck, setDependencyCheck] = useState<DependencyCheck | null>(null)
  const [showDependencyDialog, setShowDependencyDialog] = useState(false)
  const [sectorToDelete, setSectorToDelete] = useState<SectorWithSubsectors | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const sectorsPerPage = 8

  const filteredSectors = sectors.filter(
    (sector) =>
      sector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sector.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sector.responsible.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sector.subsectors.some(
        (sub) =>
          sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.description.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  )

  // Cálculos de paginação
  const totalPages = Math.ceil(filteredSectors.length / sectorsPerPage)
  const startIndex = (currentPage - 1) * sectorsPerPage
  const endIndex = startIndex + sectorsPerPage
  const currentSectors = filteredSectors.slice(startIndex, endIndex)

  // Funções de navegação
  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Reset página quando filtro muda
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleAddSector = async (sector: Omit<SectorWithSubsectors, "id" | "createdAt" | "updatedAt">) => {
    try {
      const response = await fetch('/api/sectors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: sector.name,
          description: sector.description,
          responsible: sector.responsible
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar setor')
      }

      // Criar subsetores se existirem
      const sectorData = await response.json()
      for (const subsector of sector.subsectors) {
        await fetch('/api/subsectors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: subsector.name,
            description: subsector.description,
            sector_id: sectorData.id
          }),
        })
      }

      console.log('Setor criado com sucesso!')
      await refetch() // Recarregar dados
      setShowForm(false)
    } catch (error) {
      console.error('Erro ao criar setor:', error)
      alert('Erro ao criar setor. Tente novamente.')
    }
  }

  const handleEditSector = (sector: SectorWithSubsectors) => {
    setEditingSector(sector)
    setShowForm(true)
  }

  const handleUpdateSector = async (updatedSector: Omit<SectorWithSubsectors, "id" | "createdAt" | "updatedAt">) => {
    if (!editingSector) return

    try {
      // Atualizar setor
      const response = await fetch('/api/sectors', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingSector.id,
          name: updatedSector.name,
          description: updatedSector.description,
          responsible: updatedSector.responsible
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar setor')
      }

      const sectorData = await response.json()

      // Primeiro, deletar todos os subsetores existentes
      for (const existingSubsector of editingSector.subsectors) {
        await fetch('/api/subsectors', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: existingSubsector.id
          }),
        })
      }

      // Depois, criar os novos subsetores
      for (const subsector of updatedSector.subsectors) {
        await fetch('/api/subsectors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: subsector.name,
            description: subsector.description,
            sector_id: editingSector.id
          }),
        })
      }
      
      console.log('Setor atualizado com sucesso!')
      await refetch() // Recarregar dados
      setShowForm(false)
      setEditingSector(null)
    } catch (error) {
      console.error('Erro ao atualizar setor:', error)
      alert('Erro ao atualizar setor. Tente novamente.')
    }
  }

  const handleDeleteSector = async (sector: SectorWithSubsectors) => {
    try {
      // Usar dados reais dos subsetores do setor
      const cascadeDeletes = []
      
      if (sector.subsectors.length > 0) {
        cascadeDeletes.push({
          type: "subsectors",
          count: sector.subsectors.length,
          items: sector.subsectors.map(sub => ({
            id: sub.id,
            name: sub.name,
          })),
        })
      }

      const dependencies = {
        canDelete: true,
        blockedBy: [],
        cascadeDeletes,
      }
      
      setDependencyCheck(dependencies)
      setSectorToDelete(sector)
      setShowDependencyDialog(true)
    } catch (error) {
      console.error('Erro ao verificar dependências:', error)
      alert('Erro ao verificar dependências do setor')
    }
  }

  const confirmDelete = async () => {
    if (!sectorToDelete) return

    try {
      const response = await fetch(`/api/sectors`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: sectorToDelete.id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir setor')
      }

      console.log(`${sectorToDelete.name} foi excluído com sucesso`)
      await refetch() // Recarregar dados
      setSectorToDelete(null)
      setShowDependencyDialog(false)
    } catch (error) {
      console.error('Erro ao excluir setor:', error)
      alert(`Erro ao excluir setor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingSector(null)
  }

  if (showForm) {
    return (
      <SectorForm
        sector={editingSector}
        onSubmit={editingSector ? handleUpdateSector : handleAddSector}
        onCancel={handleCloseForm}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Setores e Subsetores</h1>
          <p className="text-muted-foreground">Gerencie os setores hospitalares e seus subsetores</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Novo Setor
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar setores ou subsetores..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-6">
        {currentSectors.map((sector) => (
          <Card key={sector.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MapIcon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">{sector.name}</CardTitle>
                  </div>
                  <CardDescription className="text-base">{sector.description}</CardDescription>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Responsável:</span> {sector.responsible}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditSector(sector)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteSector(sector)}>
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">Subsetores</h4>
                  <Badge variant="secondary">
                    {sector.subsectors.length} subsetor{sector.subsectors.length !== 1 ? "es" : ""}
                  </Badge>
                </div>

                {sector.subsectors.length > 0 ? (
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {sector.subsectors.map((subsector) => (
                      <div key={subsector.id} className="p-3 bg-muted rounded-lg border border-border">
                        <h5 className="font-medium text-sm text-foreground">{subsector.name}</h5>
                        <p className="text-xs text-muted-foreground mt-1">{subsector.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Nenhum subsetor cadastrado</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSectors.length === 0 && (
        <div className="text-center py-12">
          <MapIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum setor encontrado</p>
        </div>
      )}

      {/* Controles de Paginação */}
      {filteredSectors.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="flex items-center gap-1"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Anterior
          </Button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(page)}
                className="min-w-[40px]"
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1"
          >
            Próximo
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Informações da Paginação */}
      {filteredSectors.length > 0 && (
        <div className="text-center text-sm text-muted-foreground mt-4">
          Mostrando {startIndex + 1} a {Math.min(endIndex, filteredSectors.length)} de {filteredSectors.length} setores
          {totalPages > 1 && ` • Página ${currentPage} de ${totalPages}`}
        </div>
      )}

      <DependencyDialog
        open={showDependencyDialog}
        onOpenChange={setShowDependencyDialog}
        dependencyCheck={dependencyCheck}
        itemName={sectorToDelete?.name || ""}
        itemType="setor"
        onConfirmDelete={dependencyCheck?.canDelete ? confirmDelete : undefined}
      />
    </div>
  )
}
