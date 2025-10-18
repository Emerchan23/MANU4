'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink,
  Database,
  Link as LinkIcon,
  Trash2,
  Power
} from 'lucide-react';

interface DependencyInfo {
  canDelete: boolean;
  dependencyCount: number;
  dependencies: {
    entityType: string;
    entityId: number;
    entityName: string;
    relationshipType: string;
  }[];
  suggestions: string[];
  validationRules: {
    ruleType: string;
    customMessage?: string;
  }[];
  entityInfo: {
    id: number;
    name: string;
    type: string;
  };
}

export default function DependencyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [dependencyInfo, setDependencyInfo] = useState<DependencyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const entityType = params.entityType as string;
  const entityId = params.id as string;

  const entityTypeLabels: Record<string, string> = {
    companies: 'Empresa',
    sectors: 'Setor',
    subsectors: 'Subsetor',
    equipment: 'Equipamento',
    users: 'Usuário',
    service_orders: 'Ordem de Serviço',
    alerts: 'Alerta',
    specialties: 'Especialidade',
    template_categories: 'Categoria de Template',
    service_templates: 'Template de Serviço'
  };

  const relationshipLabels: Record<string, string> = {
    'one-to-many': 'Um para Muitos',
    'many-to-one': 'Muitos para Um',
    'many-to-many': 'Muitos para Muitos',
    'one-to-one': 'Um para Um'
  };

  const fetchDependencyInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/validation/dependencies/${entityType}/${entityId}?page=${page}&limit=10`
      );
      
      if (!response.ok) {
        throw new Error('Erro ao carregar informações de dependência');
      }
      
      const data = await response.json();
      setDependencyInfo(data);
      setTotalPages(Math.ceil(data.dependencyCount / 10));
    } catch (error) {
      console.error('Error fetching dependency info:', error);
      toast.error('Erro ao carregar informações de dependência');
    } finally {
      setLoading(false);
    }
  };

  const handleForceDelete = async () => {
    if (!confirm('Tem certeza que deseja forçar a exclusão? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch(`/api/${entityType}/${entityId}?force=true`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir registro');
      }

      toast.success('Registro excluído com sucesso!');
      router.back();
    } catch (error) {
      console.error('Error force deleting:', error);
      toast.error('Erro ao excluir registro');
    }
  };

  const handleDeactivate = async () => {
    try {
      const response = await fetch(`/api/${entityType}/${entityId}/deactivate`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Erro ao desativar registro');
      }

      toast.success('Registro desativado com sucesso!');
      router.back();
    } catch (error) {
      console.error('Error deactivating:', error);
      toast.error('Erro ao desativar registro');
    }
  };

  const navigateToEntity = (depEntityType: string, depEntityId: number) => {
    // Navegar para a página de detalhes da entidade dependente
    const routes: Record<string, string> = {
      companies: '/empresas',
      sectors: '/setores',
      subsectors: '/subsetores',
      equipment: '/equipamentos',
      users: '/usuarios',
      service_orders: '/ordens-servico',
      alerts: '/alertas',
      specialties: '/especialidades',
      template_categories: '/categorias-template',
      service_templates: '/templates-servico'
    };

    const route = routes[depEntityType];
    if (route) {
      window.open(`${route}/${depEntityId}`, '_blank');
    }
  };

  useEffect(() => {
    fetchDependencyInfo();
  }, [entityType, entityId, page]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-3 text-lg">Carregando informações...</span>
        </div>
      </div>
    );
  }

  if (!dependencyInfo) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Erro ao carregar informações</h2>
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar as informações de dependência para este registro.
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Dependências de {entityTypeLabels[entityType]}</h1>
            <p className="text-muted-foreground mt-1">
              {dependencyInfo.entityInfo.name} (ID: {dependencyInfo.entityInfo.id})
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchDependencyInfo} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Status de Integridade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${dependencyInfo.canDelete ? 'text-green-600' : 'text-red-600'}`}>
                {dependencyInfo.canDelete ? 'PODE' : 'NÃO PODE'}
              </div>
              <p className="text-sm text-muted-foreground">Ser Excluído</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {dependencyInfo.dependencyCount}
              </div>
              <p className="text-sm text-muted-foreground">Dependências Encontradas</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {dependencyInfo.validationRules.length}
              </div>
              <p className="text-sm text-muted-foreground">Regras Aplicadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regras de Validação */}
      {dependencyInfo.validationRules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Regras de Validação Aplicadas</CardTitle>
            <CardDescription>
              Regras de integridade referencial que se aplicam a esta entidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dependencyInfo.validationRules.map((rule, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Badge variant="outline">{rule.ruleType}</Badge>
                    {rule.customMessage && (
                      <p className="text-sm text-muted-foreground mt-1">{rule.customMessage}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dependências */}
      {dependencyInfo.dependencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Registros Dependentes
            </CardTitle>
            <CardDescription>
              Registros que fazem referência a esta entidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dependencyInfo.dependencies.map((dep, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{entityTypeLabels[dep.entityType]}</Badge>
                        <Badge variant="secondary">ID: {dep.entityId}</Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                          {relationshipLabels[dep.relationshipType] || dep.relationshipType}
                        </Badge>
                      </div>
                      <p className="font-medium">{dep.entityName}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToEntity(dep.entityType, dep.entityId)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Próxima
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sugestões */}
      {dependencyInfo.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sugestões de Ação</CardTitle>
            <CardDescription>
              Ações recomendadas para resolver as dependências
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dependencyInfo.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <p className="text-sm">{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Disponíveis</CardTitle>
          <CardDescription>
            Opções para lidar com as dependências encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={handleDeactivate}
              className="flex items-center gap-2"
            >
              <Power className="h-4 w-4" />
              Desativar Registro
            </Button>
            <Button
              variant="destructive"
              onClick={handleForceDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Forçar Exclusão
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            <strong>Desativar:</strong> Mantém o registro no banco mas o marca como inativo.<br />
            <strong>Forçar Exclusão:</strong> Remove o registro permanentemente, ignorando as dependências.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}