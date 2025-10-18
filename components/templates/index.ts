// Components
export { TemplateManager } from './TemplateManager'
export { TemplateList } from './TemplateList'
export { TemplateForm } from './TemplateForm'
export { CategoryList } from './CategoryList'
export { CategoryForm } from './CategoryForm'
export { TemplateSelector } from './TemplateSelector'

// Re-exportar tipos dos hooks para conveniência
export type { ServiceTemplate, ServiceTemplatePagination } from '@/hooks/useServiceTemplates'
export type { TemplateCategory, TemplateCategoryPagination } from '@/hooks/useTemplateCategories'