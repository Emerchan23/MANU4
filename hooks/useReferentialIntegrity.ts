import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface DependencyInfo {
  entity: string;
  entityDisplayName: string;
  count: number;
  records?: any[];
  foreignKey: string;
  relationshipType: string;
}

interface ValidationResult {
  canDelete: boolean;
  dependencies: DependencyInfo[];
  totalCount: number;
  suggestions: Array<{
    type: string;
    message: string;
    action: string;
    url?: string;
    description?: string;
  }>;
  validationRules: Record<string, any>;
  customMessages: Record<string, string>;
}

interface UseReferentialIntegrityOptions {
  entityType: string;
  onNavigateToEntity?: (entityType: string, entityId: number) => void;
  onDeactivateInstead?: (entityId: number) => Promise<void>;
}

export function useReferentialIntegrity({
  entityType,
  onNavigateToEntity,
  onDeactivateInstead
}: UseReferentialIntegrityOptions) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const checkDependencies = useCallback(async (entityId: number, includeDetails = false) => {
    setIsValidating(true);
    try {
      const response = await fetch('/api/validation/check-dependencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType,
          entityId,
          includeDetails
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao validar dependências');
      }

      const result: ValidationResult = await response.json();
      setValidationResult(result);
      return result;
    } catch (error) {
      console.error('Erro na validação:', error);
      toast.error('Erro ao validar dependências');
      return null;
    } finally {
      setIsValidating(false);
    }
  }, [entityType]);

  const validateAndDelete = useCallback(async (
    entityId: number,
    deleteFunction: () => Promise<void>,
    entityName?: string
  ) => {
    const result = await checkDependencies(entityId);
    
    if (!result) {
      return false;
    }

    if (result.canDelete) {
      // Pode excluir sem problemas
      try {
        await deleteFunction();
        toast.success(`${entityName || 'Registro'} excluído com sucesso!`);
        return true;
      } catch (error) {
        toast.error('Erro ao excluir registro');
        return false;
      }
    } else {
      // Tem dependências - mostrar alerta informativo
      showDependencyAlert(result, entityId, entityName);
      return false;
    }
  }, [checkDependencies]);

  const showDependencyAlert = useCallback((
    result: ValidationResult,
    entityId: number,
    entityName?: string
  ) => {
    const dependencyMessages = result.dependencies.map(dep => {
      const customMessage = result.customMessages[dep.entity];
      if (customMessage) {
        return customMessage.replace('{count}', dep.count.toString());
      }
      return `${dep.entityDisplayName || dep.entity}: ${dep.count} registro${dep.count > 1 ? 's' : ''}`;
    });

    const message = `Não é possível excluir ${entityName || 'este registro'} pois possui registros vinculados:\n\n${dependencyMessages.join('\n')}`;

    toast.error(message, {
      duration: 8000,
      action: result.suggestions.length > 0 ? {
        label: result.suggestions[0].message,
        onClick: () => handleSuggestionAction(result.suggestions[0], entityId)
      } : undefined,
    });
  }, []);

  const handleSuggestionAction = useCallback((suggestion: any, entityId: number) => {
    switch (suggestion.action) {
      case 'navigate':
        if (suggestion.url && onNavigateToEntity) {
          // Extrair entityType e id da URL se necessário
          window.open(suggestion.url, '_blank');
        }
        break;
      case 'deactivate':
        if (onDeactivateInstead) {
          onDeactivateInstead(entityId);
        } else {
          toast.info('Funcionalidade de desativação não implementada para esta entidade');
        }
        break;
      case 'manual':
        toast.info(suggestion.description || 'Ação manual necessária');
        break;
      default:
        console.log('Ação não reconhecida:', suggestion.action);
    }
  }, [onNavigateToEntity, onDeactivateInstead]);

  const getDependencyDetails = useCallback(async (entityId: number, page = 1, limit = 10) => {
    try {
      const response = await fetch(`/api/validation/dependencies/${entityType}/${entityId}?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar detalhes das dependências');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar dependências:', error);
      toast.error('Erro ao carregar detalhes das dependências');
      return null;
    }
  }, [entityType]);

  const formatDependencyMessage = useCallback((
    dependencies: DependencyInfo[],
    customMessages: Record<string, string>
  ) => {
    return dependencies.map(dep => {
      const customMessage = customMessages[dep.entity];
      if (customMessage) {
        return customMessage.replace('{count}', dep.count.toString());
      }
      
      const displayName = getEntityDisplayName(dep.entity);
      const count = dep.count;
      const plural = count > 1 ? 's' : '';
      
      return `${displayName}: ${count} registro${plural} vinculado${plural}`;
    }).join('\n');
  }, []);

  return {
    isValidating,
    validationResult,
    checkDependencies,
    validateAndDelete,
    showDependencyAlert,
    getDependencyDetails,
    formatDependencyMessage
  };
}

function getEntityDisplayName(entityType: string): string {
  const displayNames: Record<string, string> = {
    companies: 'Empresas',
    sectors: 'Setores',
    subsectors: 'Subsetores',
    equipment: 'Equipamentos',
    users: 'Usuários',
    service_orders: 'Ordens de Serviço',
    alerts: 'Alertas',
    specialties: 'Especialidades',
    template_categories: 'Categorias de Template',
    service_templates: 'Templates de Serviço',
    maintenance_plans: 'Planos de Manutenção'
  };

  return displayNames[entityType] || entityType;
}