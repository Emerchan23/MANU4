"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type TemplateCategory } from '@/hooks/useTemplateCategories'

interface CategoryFormProps {
  category?: TemplateCategory | null
  onSubmit: (data: Partial<TemplateCategory>) => Promise<void>
  onCancel: () => void
  loading?: boolean
  availableColors?: string[]
  nextColor?: string
}

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#EC4899', // pink
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#A855F7', // purple
  '#22C55E', // green
  '#F43F5E', // rose
  '#0EA5E9', // sky
  '#64748B'  // slate
]

export function CategoryForm({
  category,
  onSubmit,
  onCancel,
  loading = false,
  availableColors = DEFAULT_COLORS,
  nextColor
}: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: nextColor || DEFAULT_COLORS[0],
    active: true
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        color: category.color || nextColor || DEFAULT_COLORS[0],
        active: category.active ?? true
      })
    } else {
      setFormData({
        name: '',
        description: '',
        color: nextColor || DEFAULT_COLORS[0],
        active: true
      })
    }
    setErrors({})
  }, [category, nextColor])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Nome deve ter no máximo 100 caracteres'
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Descrição deve ter no máximo 500 caracteres'
    }

    if (!formData.color) {
      newErrors.color = 'Cor é obrigatória'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit({
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || null
      })
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const isEditing = !!category

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full border" 
            style={{ backgroundColor: formData.color }}
          />
          {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Manutenção Preventiva"
              className={errors.name ? 'border-destructive' : ''}
              maxLength={100}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.name.length}/100 caracteres
            </p>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva o propósito desta categoria..."
              className={errors.description ? 'border-destructive' : ''}
              rows={3}
              maxLength={500}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/500 caracteres
            </p>
          </div>

          {/* Cor */}
          <div className="space-y-3">
            <Label>Cor da Categoria *</Label>
            <div className="grid grid-cols-8 gap-2">
              {availableColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleInputChange('color', color)}
                  className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                    formData.color === color 
                      ? 'border-foreground shadow-md' 
                      : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            {errors.color && (
              <p className="text-sm text-destructive">{errors.color}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Cor selecionada:</span>
              <div 
                className="w-4 h-4 rounded border" 
                style={{ backgroundColor: formData.color }}
              />
              <code className="bg-muted px-2 py-1 rounded text-xs">
                {formData.color}
              </code>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="active">Status da Categoria</Label>
              <p className="text-sm text-muted-foreground">
                {formData.active 
                  ? 'Categoria ativa e disponível para uso' 
                  : 'Categoria inativa e não disponível para novos templates'
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => handleInputChange('active', checked)}
              />
              <Badge variant={formData.active ? 'default' : 'secondary'}>
                {formData.active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <Label className="text-sm font-medium">Preview da Categoria</Label>
            <div className="mt-2 flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full border" 
                style={{ backgroundColor: formData.color }}
              />
              <span className="font-medium">
                {formData.name || 'Nome da categoria'}
              </span>
              <Badge variant={formData.active ? 'default' : 'secondary'}>
                {formData.active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            {formData.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {formData.description}
              </p>
            )}
          </div>

          {/* Botões */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Salvando...' : (isEditing ? 'Atualizar Categoria' : 'Criar Categoria')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}