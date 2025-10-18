"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { MagnifyingGlassIcon, EyeIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useServiceTemplates, type ServiceTemplate } from '@/hooks/useServiceTemplates'
import { useTemplateCategories } from '@/hooks/useTemplateCategories'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TemplateSelectorProps {
  onTemplateSelect: (template: ServiceTemplate) => void
  onTemplateApply: (content: string) => void
  selectedTemplateId?: number | null
  className?: string
}

export function TemplateSelector({
  onTemplateSelect,
  onTemplateApply,
  selectedTemplateId,
  className
}: TemplateSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [previewTemplate, setPreviewTemplate] = useState<ServiceTemplate | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const {
    serviceTemplates: templates,
    loading: templatesLoading,
    refetch: fetchTemplates
  } = useServiceTemplates()

  const {
    categories,
    loading: categoriesLoading,
    fetchCategories
  } = useTemplateCategories()

  useEffect(() => {
    fetchCategories({ active: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // For now, just fetch all templates - can be enhanced later with filters
    fetchTemplates()
  }, [searchTerm, selectedCategoryId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTemplateSelect = (template: ServiceTemplate) => {
    onTemplateSelect(template)
  }

  const handleTemplateApply = (template: ServiceTemplate) => {
    onTemplateApply(template.content)
  }

  const handlePreview = (template: ServiceTemplate) => {
    setPreviewTemplate(template)
    setIsPreviewOpen(true)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return 'Data inválida'
    }
  }

  const getCategoryById = (categoryId: number) => {
    return categories.find(cat => cat.id === categoryId)
  }

  const processTemplateContent = (content: string) => {
    // Substitui variáveis por placeholders visuais para preview
    return content
      .replace(/\{\{EQUIPMENT_NAME\}\}/g, '[Nome do Equipamento]')
      .replace(/\{\{EQUIPMENT_CODE\}\}/g, '[Código do Equipamento]')
      .replace(/\{\{COMPANY_NAME\}\}/g, '[Nome da Empresa]')
      .replace(/\{\{SECTOR_NAME\}\}/g, '[Nome do Setor]')
      .replace(/\{\{MAINTENANCE_TYPE\}\}/g, '[Tipo de Manutenção]')
      .replace(/\{\{DATE\}\}/g, '[Data Atual]')
      .replace(/\{\{TIME\}\}/g, '[Hora Atual]')
      .replace(/\{\{TECHNICIAN_NAME\}\}/g, '[Nome do Técnico]')
  }

  if (templatesLoading && (!templates || templates.length === 0)) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Templates */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {!templates || templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <DocumentTextIcon className="h-12 w-12 text-muted-foreground mb-2" />
              <h3 className="font-semibold mb-1">Nenhum template encontrado</h3>
              <p className="text-sm text-muted-foreground text-center">
                {searchTerm || selectedCategoryId !== 'all'
                  ? 'Tente ajustar os filtros para encontrar templates.'
                  : 'Não há templates disponíveis no momento.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => {
            const category = getCategoryById(template.category_id)
            const isSelected = selectedTemplateId === template.id
            
            return (
              <Card 
                key={template.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium truncate">{template.name}</h4>
                        {category && (
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{ 
                              borderColor: category.color,
                              color: category.color
                            }}
                          >
                            {category.name}
                          </Badge>
                        )}
                      </div>
                      
                      {template.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Atualizado em {formatDate(template.updated_at)}</span>
                        <span>{template.content?.length || 0} caracteres</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePreview(template)
                        }}
                        title="Visualizar template"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTemplateApply(template)
                        }}
                        title="Aplicar template"
                      >
                        {isSelected ? 'Aplicado' : 'Aplicar'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Dialog de Preview */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5" />
              Preview do Template
            </DialogTitle>
          </DialogHeader>
          
          {previewTemplate && (
            <div className="space-y-4">
              {/* Informações do Template */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{previewTemplate.name}</h3>
                  {previewTemplate.description && (
                    <p className="text-sm text-muted-foreground">
                      {previewTemplate.description}
                    </p>
                  )}
                </div>
                {getCategoryById(previewTemplate.category_id) && (
                  <Badge 
                    variant="outline"
                    style={{ 
                      borderColor: getCategoryById(previewTemplate.category_id)?.color,
                      color: getCategoryById(previewTemplate.category_id)?.color
                    }}
                  >
                    {getCategoryById(previewTemplate.category_id)?.name}
                  </Badge>
                )}
              </div>
              
              <Separator />
              
              {/* Conteúdo do Template */}
              <div>
                <Label className="text-sm font-medium">Conteúdo do Template</Label>
                <ScrollArea className="h-64 w-full border rounded-md p-3 mt-2">
                  <pre className="text-sm whitespace-pre-wrap">
                    {processTemplateContent(previewTemplate.content)}
                  </pre>
                </ScrollArea>
              </div>
              
              {/* Botões */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={() => {
                    handleTemplateApply(previewTemplate)
                    setIsPreviewOpen(false)
                  }}
                  className="flex-1"
                >
                  Aplicar Template
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}