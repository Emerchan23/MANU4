"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InformationCircleIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { type ServiceTemplate } from '@/hooks/useServiceTemplates'
import { type TemplateCategory } from '@/hooks/useTemplateCategories'
import { toast } from 'sonner'

interface TemplateFormProps {
  template?: ServiceTemplate | null
  categories: TemplateCategory[]
  onSubmit: (data: any) => void
  onCancel: () => void
}

interface FormData {
  name: string
  description: string
  category_id: string
  content: string
  variables: string[]
  active: boolean
}

interface TemplateVariable {
  name: string
  description: string
  example: string
}

// Variáveis predefinidas disponíveis
const PREDEFINED_VARIABLES: TemplateVariable[] = [
  {
    name: '{EQUIPMENT_NAME}',
    description: 'Nome do equipamento',
    example: 'Ventilador Pulmonar'
  },
  {
    name: '{EQUIPMENT_MODEL}',
    description: 'Modelo do equipamento',
    example: 'VP-2000'
  },
  {
    name: '{EQUIPMENT_MANUFACTURER}',
    description: 'Fabricante do equipamento',
    example: 'MedTech'
  },
  {
    name: '{EQUIPMENT_SERIAL}',
    description: 'Número de série',
    example: 'SN123456'
  },
  {
    name: '{EQUIPMENT_PATRIMONIO}',
    description: 'Número do patrimônio',
    example: 'PAT001'
  },
  {
    name: '{SECTOR_NAME}',
    description: 'Nome do setor',
    example: 'UTI'
  },
  {
    name: '{SUBSECTOR_NAME}',
    description: 'Nome do subsetor',
    example: 'UTI Adulto'
  },
  {
    name: '{MAINTENANCE_TYPE}',
    description: 'Tipo de manutenção',
    example: 'Preventiva'
  },
  {
    name: '{CURRENT_DATE}',
    description: 'Data atual',
    example: '15/01/2024'
  },
  {
    name: '{TECHNICIAN_NAME}',
    description: 'Nome do técnico',
    example: 'João Silva'
  }
]

export function TemplateForm({ template, categories, onSubmit, onCancel }: TemplateFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category_id: '',
    content: '',
    variables: [],
    active: true
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showVariableHelper, setShowVariableHelper] = useState(false)

  // Carregar dados do template para edição
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        category_id: template.category_id.toString(),
        content: template.content,
        variables: template.variables || [],
        active: template.active
      })
    }
  }, [template])

  // Validação do formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    } else if (formData.name.length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres'
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Categoria é obrigatória'
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Conteúdo do template é obrigatório'
    } else if (formData.content.length < 10) {
      newErrors.content = 'Conteúdo deve ter pelo menos 10 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Extrair variáveis do conteúdo
  const extractVariables = (content: string): string[] => {
    const variableRegex = /\{[A-Z_]+\}/g
    const matches = content.match(variableRegex) || []
    return [...new Set(matches)] // Remove duplicatas
  }

  // Atualizar variáveis quando o conteúdo muda
  const handleContentChange = (content: string) => {
    const extractedVariables = extractVariables(content)
    setFormData(prev => ({
      ...prev,
      content,
      variables: extractedVariables
    }))
  }

  // Inserir variável no conteúdo
  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = formData.content.substring(0, start) + variable + formData.content.substring(end)
      handleContentChange(newContent)
      
      // Reposicionar cursor
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length, start + variable.length)
      }, 0)
    }
  }

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário')
      return
    }

    setIsSubmitting(true)
    
    try {
      const submitData = {
        ...formData,
        category_id: parseInt(formData.category_id)
      }
      
      await onSubmit(submitData)
    } catch (error) {
      console.error('Erro ao submeter formulário:', error)
      toast.error('Erro ao salvar template')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id.toString() === categoryId)
    return category?.name || 'Categoria não encontrada'
  }

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id.toString() === categoryId)
    return category?.color || '#6B7280'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>
            Defina as informações principais do template
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Template *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Manutenção Preventiva Ventilador"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger className={errors.category_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.active).map((category) => (
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
              {errors.category_id && (
                <p className="text-sm text-destructive">{errors.category_id}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva quando e como usar este template..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
            />
            <Label htmlFor="active">Template ativo</Label>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo do Template */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Conteúdo do Template</CardTitle>
              <CardDescription>
                Escreva o conteúdo do template usando variáveis dinâmicas
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowVariableHelper(!showVariableHelper)}
            >
              {showVariableHelper ? 'Ocultar' : 'Mostrar'} Variáveis
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showVariableHelper && (
            <Alert>
              <InformationCircleIcon className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-medium">Variáveis disponíveis:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {PREDEFINED_VARIABLES.map((variable) => (
                      <div key={variable.name} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex-1">
                          <code className="text-sm font-mono">{variable.name}</code>
                          <p className="text-xs text-muted-foreground">{variable.description}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertVariable(variable.name)}
                        >
                          <PlusIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="template-content">Conteúdo *</Label>
            <Textarea
              id="template-content"
              value={formData.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Escreva o conteúdo do template aqui...\n\nExemplo:\nRealizada manutenção preventiva no equipamento {EQUIPMENT_NAME} modelo {EQUIPMENT_MODEL}, localizado no setor {SECTOR_NAME}.\n\nProcedimentos executados:\n- Limpeza geral do equipamento\n- Verificação de componentes\n- Teste de funcionamento"
              rows={10}
              className={errors.content ? 'border-destructive' : ''}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content}</p>
            )}
          </div>

          {/* Variáveis Detectadas */}
          {formData.variables.length > 0 && (
            <div className="space-y-2">
              <Label>Variáveis detectadas no template:</Label>
              <div className="flex flex-wrap gap-2">
                {formData.variables.map((variable) => (
                  <Badge key={variable} variant="secondary">
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {formData.content && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Visualização de como o template aparecerá (com valores de exemplo)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <div className="whitespace-pre-wrap text-sm">
                {PREDEFINED_VARIABLES.reduce(
                  (content, variable) => 
                    content.replace(new RegExp(variable.name.replace(/[{}]/g, '\\$&'), 'g'), variable.example),
                  formData.content
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <div className="flex items-center justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : (template ? 'Atualizar' : 'Criar')} Template
        </Button>
      </div>
    </form>
  )
}