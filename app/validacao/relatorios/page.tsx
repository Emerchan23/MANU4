'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  FileText, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Calendar,
  Filter
} from 'lucide-react';

interface ValidationLog {
  id: number;
  entity_type: string;
  entity_id: number;
  validation_type: string;
  validation_result: 'SUCCESS' | 'FAILED' | 'WARNING';
  dependency_count: number;
  error_message?: string;
  created_at: string;
}

interface ReportSummary {
  totalValidations: number;
  successfulValidations: number;
  failedValidations: number;
  warningValidations: number;
  entitiesWithDependencies: number;
  averageDependenciesPerEntity: number;
}

export default function ValidationReportsPage() {
  const [logs, setLogs] = useState<ValidationLog[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('7'); // últimos 7 dias
  const [entityFilter, setEntityFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');

  const entityTypes = [
    { value: 'all', label: 'Todas as Entidades' },
    { value: 'companies', label: 'Empresas' },
    { value: 'sectors', label: 'Setores' },
    { value: 'subsectors', label: 'Subsetores' },
    { value: 'equipment', label: 'Equipamentos' },
    { value: 'users', label: 'Usuários' },
    { value: 'service_orders', label: 'Ordens de Serviço' },
    { value: 'alerts', label: 'Alertas' },
    { value: 'specialties', label: 'Especialidades' },
    { value: 'template_categories', label: 'Categorias de Template' },
    { value: 'service_templates', label: 'Templates de Serviço' }
  ];

  const dateFilters = [
    { value: '1', label: 'Último dia' },
    { value: '7', label: 'Últimos 7 dias' },
    { value: '30', label: 'Últimos 30 dias' },
    { value: '90', label: 'Últimos 90 dias' }
  ];

  const resultFilters = [
    { value: 'all', label: 'Todos os Resultados' },
    { value: 'SUCCESS', label: 'Sucessos' },
    { value: 'FAILED', label: 'Falhas' },
    { value: 'WARNING', label: 'Avisos' }
  ];

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Buscar logs com filtros
      const logsParams = new URLSearchParams({
        days: dateFilter,
        ...(entityFilter !== 'all' && { entityType: entityFilter }),
        ...(resultFilter !== 'all' && { result: resultFilter })
      });
      
      const [logsResponse, summaryResponse] = await Promise.all([
        fetch(`/api/validation/logs?${logsParams}`),
        fetch(`/api/validation/reports/summary?days=${dateFilter}`)
      ]);

      if (!logsResponse.ok || !summaryResponse.ok) {
        throw new Error('Erro ao carregar relatórios');
      }

      const logsData = await logsResponse.json();
      const summaryData = await summaryResponse.json();

      setLogs(logsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams({
        days: dateFilter,
        format,
        ...(entityFilter !== 'all' && { entityType: entityFilter }),
        ...(resultFilter !== 'all' && { result: resultFilter })
      });

      const response = await fetch(`/api/validation/reports/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao exportar relatório');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `validation-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateFilter, entityFilter, resultFilter]);

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'SUCCESS':
        return <Badge className="bg-green-100 text-green-800">Sucesso</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Falha</Badge>;
      case 'WARNING':
        return <Badge className="bg-yellow-100 text-yellow-800">Aviso</Badge>;
      default:
        return <Badge variant="secondary">{result}</Badge>;
    }
  };

  const getEntityLabel = (entityType: string) => {
    return entityTypes.find(et => et.value === entityType)?.label || entityType;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Relatórios de Validação
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualize e analise os logs de validação de integridade referencial
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => exportReport('csv')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => exportReport('json')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
          <Button onClick={fetchReports}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Período</label>
              <select
                className="w-full p-2 border rounded-md"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                {dateFilters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Entidade</label>
              <select
                className="w-full p-2 border rounded-md"
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
              >
                {entityTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Resultado</label>
              <select
                className="w-full p-2 border rounded-md"
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
              >
                {resultFilters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{summary.totalValidations}</p>
              <p className="text-sm text-muted-foreground">Total de Validações</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{summary.successfulValidations}</p>
              <p className="text-sm text-muted-foreground">Sucessos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{summary.failedValidations}</p>
              <p className="text-sm text-muted-foreground">Falhas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{summary.warningValidations}</p>
              <p className="text-sm text-muted-foreground">Avisos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{summary.entitiesWithDependencies}</p>
              <p className="text-sm text-muted-foreground">Entidades c/ Dependências</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{summary.averageDependenciesPerEntity.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Média de Dependências</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logs de Validação */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Validação</CardTitle>
          <CardDescription>
            Histórico detalhado das validações de integridade referencial
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum log encontrado para os filtros selecionados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    {getResultIcon(log.validation_result)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{getEntityLabel(log.entity_type)}</span>
                        <Badge variant="outline">ID: {log.entity_id}</Badge>
                        {getResultBadge(log.validation_result)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {log.validation_type} • {log.dependency_count} dependência(s)
                      </p>
                      {log.error_message && (
                        <p className="text-sm text-red-600 mt-1">{log.error_message}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}