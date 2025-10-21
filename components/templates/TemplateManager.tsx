"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, FolderIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useServiceTemplates, type ServiceTemplate } from '@/hooks/useServiceTemplates'
import { useTemplateCategories, type TemplateCategory } from '@/hooks/useTemplateCategories'
import { TemplateForm } from './TemplateForm'
import { TemplateList } from './TemplateList'
import { CategoryForm } from './CategoryForm'
import { CategoryList } from './CategoryList'
import { toast } from 'sonner'

export function TemplateManager() {
  const [activeTab, setActiveTab] = useState('templates')
  const [selectedTemplate, setSelectedTemplate] = useState<ServiceTemplate | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | null>(null)
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false)
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<ServiceTemplate | null>(null)

  const {
    serviceTemplates: templates,
    loading: templatesLoading,
    refetch: fetchTemplates,
    createServiceTemplate: createTemplate,
    updateServiceTemplate: updateTemplate,
    deleteServiceTemplate: deleteTemplate
  } = useServiceTemplates()

  const {
    categories,
    loading: categoriesLoading,
    pagination: categoriesPagination,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    setFilters: setCategoryFilters
  } = useTemplateCategories()

  // Listener para evento customizado de filtrar por categoria
  useEffect(() => {
    const handleFilterByCategory = (event: CustomEvent) => {
      const { categoryId } = event.detail
      setActiveTab('templates')
      // For now, just refetch templates when category filter is applied
      fetchTemplates()
    }

    window.addEventListener('filterByCategory', handleFilterByCategory as EventListener)
    
    return () => {
      window.removeEventListener('filterByCategory', handleFilterByCategory as EventListener)
    }
  }, [])

  // Handlers para templates
  const handleCreateTemplate = () => {
    setSelectedTemplate(null)
    setIsTemplateFormOpen(true)
  }

  const handleEditTemplate = (template: ServiceTemplate) => {
    setSelectedTemplate(template)
    setIsTemplateFormOpen(true)
  }

  const handleDeleteTemplate = async (template: ServiceTemplate) => {
    const success = await deleteTemplate(template.id)
    if (success) {
      await fetchTemplates()
    }
  }

  const handlePreviewTemplate = (template: ServiceTemplate) => {
    setPreviewTemplate(template)
    setIsPreviewOpen(true)
  }

  const handleTemplateSubmit = async (data: any) => {
    let success = false
    
    if (selectedTemplate) {
      success = await updateTemplate(selectedTemplate.id, data) !== null
    } else {
      success = await createTemplate(data) !== null
    }

    if (success) {
      setIsTemplateFormOpen(false)
      setSelectedTemplate(null)
      await fetchTemplates()
    }
  }

  // Handlers para categorias
  const handleCreateCategory = () => {
    setSelectedCategory(null)
    setIsCategoryFormOpen(true)
  }

  const handleEditCategory = (category: TemplateCategory) => {
    setSelectedCategory(category)
    setIsCategoryFormOpen(true)
  }

  const handleDeleteCategory = async (category: TemplateCategory) => {
    const success = await deleteCategory(category.id)
    if (success) {
      await fetchCategories()
    }
  }

  const handleCategorySubmit = async (data: any) => {
    let success = false
    
    if (selectedCategory) {
      success = await updateCategory({ ...data, id: selectedCategory.id }) !== null
    } else {
      success = await createCategory(data) !== null
    }

    if (success) {
      setIsCategoryFormOpen(false)
      setSelectedCategory(null)
      await fetchCategories()
    }
  }

  // Filtros e busca
  const handleTemplateSearch = (search: string) => {
    // For now, just refetch templates - can be enhanced later with search functionality
    fetchTemplates()
  }

  const handleCategorySearch = (search: string) => {
    setCategoryFilters({ search, page: 1 })
  }

  const handleTemplateFilter = (filters: any) => {
    // For now, just refetch templates - can be enhanced later with filter functionality
    fetchTemplates()
  }

  const handleCategoryFilter = (filters: any) => {
    setCategoryFilters({ ...filters, page: 1 })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Templates</h1>
          <p className="text-muted-foreground">
            Gerencie templates de descrição de serviços e suas categorias
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <DocumentTextIcon className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderIcon className="h-4 w-4" />
            Categorias
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Templates de Serviço</CardTitle>
                  <CardDescription>
                    Gerencie os templates de descrição de serviços disponíveis
                  </CardDescription>
                </div>
                <Button onClick={handleCreateTemplate}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Novo Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TemplateList
                templates={templates || []}
                loading={templatesLoading}
                pagination={{
                  currentPage: 1,
                  totalPages: 1,
                  totalRecords: templates?.length || 0,
                  limit: 10,
                  hasNextPage: false,
                  hasPrevPage: false
                }}
                categories={categories}
                onEdit={handleEditTemplate}
                onDelete={handleDeleteTemplate}
                onPreview={handlePreviewTemplate}
                onSearch={handleTemplateSearch}
                onFilter={handleTemplateFilter}
                onPageChange={(page) => {
                  console.log('TemplateManager onPageChange called with page:', page);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Categorias de Templates</CardTitle>
                  <CardDescription>
                    Gerencie as categorias para organizar os templates
                  </CardDescription>
                </div>
                <Button onClick={handleCreateCategory}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CategoryList
                categories={categories}
                loading={categoriesLoading}
                pagination={categoriesPagination}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
                onSearch={handleCategorySearch}
                onFilter={handleCategoryFilter}
                onPageChange={(page) => setCategoryFilters(prev => ({ ...prev, page }))}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Form Dialog */}
      <Dialog open={isTemplateFormOpen} onOpenChange={setIsTemplateFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate 
                ? 'Edite as informações do template de serviço'
                : 'Crie um novo template de descrição de serviço'
              }
            </DialogDescription>
          </DialogHeader>
          <TemplateForm
            template={selectedTemplate}
            categories={categories}
            onSubmit={handleTemplateSubmit}
            onCancel={() => {
              setIsTemplateFormOpen(false)
              setSelectedTemplate(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Category Form Dialog */}
      <Dialog open={isCategoryFormOpen} onOpenChange={setIsCategoryFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory 
                ? 'Edite as informações da categoria'
                : 'Crie uma nova categoria para organizar os templates'
              }
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            category={selectedCategory}
            onSubmit={handleCategorySubmit}
            onCancel={() => {
              setIsCategoryFormOpen(false)
              setSelectedCategory(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview do Template</DialogTitle>
            <DialogDescription>
              Visualização de como o template será aplicado
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Informações do Template</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Nome:</span> {previewTemplate.name}</p>
                    <p><span className="font-medium">Categoria:</span> {previewTemplate.category?.name || 'Sem categoria'}</p>
                    <p><span className="font-medium">Status:</span> {previewTemplate.isActive ? 'Ativo' : 'Inativo'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Descrição</h3>
                  <p className="text-sm text-muted-foreground">{previewTemplate.description}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Conteúdo do Template</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{previewTemplate.content}</pre>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setIsPreviewOpen(false)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}