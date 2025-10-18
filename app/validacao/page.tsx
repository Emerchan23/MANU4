'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  Database, 
  Settings, 
  FileText, 
  Eye,
  RefreshCw,
  TrendingUp,
  Shield
} from 'lucide-react';
import Link from 'next/link';

interface ValidationSummary {
  totalEntities: number;
  entitiesWithDependencies: number;
  totalDependencies: number;
  recentValidations: number;
  criticalIssues: number;
}

interface EntitySummary {
  entityType: string;
  entityDisplayName: string;
  totalRecords: number;
  recordsWithDependencies: number;
  dependencyCount: number;
}

export default function ValidationDashboard() {
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [entitySummaries, setEntitySummaries] = useState<EntitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchValidationSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch validation summary
      const summaryResponse = await fetch('/api/validation/summary');
      if (!summaryResponse.ok) {
        throw new Error('Erro ao carregar resumo de validação');
      }
      const summaryData = await summaryResponse.json();
      setSummary(summaryData);

      // Fetch entity summaries
      const entitiesResponse = await fetch('/api/validation/entities-summary');
      if (!entitiesResponse.ok) {
        throw new Error('Erro ao carregar resumo de entidades');
      }
      const entitiesData = await entitiesResponse.json();
      setEntitySummaries(entitiesData);

    } catch (err) {
      console.error('Erro ao carregar dados de validação:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidationSummary();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Carregando dados de validação...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Validação de Integridade Referencial
          </h1>
          <p className="text-gray-600 mt-2">
            Monitore e gerencie as dependências entre registros do sistema
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={fetchValidationSummary} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Link href="/validacao/configuracoes">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </Link>
          <Link href="/validacao/relatorios">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Relatórios
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Entidades</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalEntities}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Com Dependências</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.entitiesWithDependencies}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Dependências</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalDependencies}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Validações Recentes</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.recentValidations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Problemas Críticos</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.criticalIssues}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Entity Summaries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Resumo por Entidade</span>
          </CardTitle>
          <CardDescription>
            Visão geral das dependências por tipo de entidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {entitySummaries.map((entity) => (
              <div
                key={entity.entityType}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{entity.entityDisplayName}</h3>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-600">
                      Total: {entity.totalRecords} registros
                    </span>
                    <span className="text-sm text-gray-600">
                      Com dependências: {entity.recordsWithDependencies}
                    </span>
                    <span className="text-sm text-gray-600">
                      Dependências: {entity.dependencyCount}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={entity.recordsWithDependencies > 0 ? "secondary" : "outline"}
                  >
                    {entity.recordsWithDependencies > 0 ? 'Com Vínculos' : 'Sem Vínculos'}
                  </Badge>
                  
                  <Link href={`/validacao/entidades/${entity.entityType}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalhes
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Ferramentas para gerenciar a integridade referencial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/validacao/configuracoes">
              <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-medium">Configurar Regras</h3>
                      <p className="text-sm text-gray-600">
                        Definir regras de validação personalizadas
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/validacao/relatorios">
              <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="font-medium">Gerar Relatórios</h3>
                      <p className="text-sm text-gray-600">
                        Relatórios detalhados de dependências
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <RefreshCw className="h-8 w-8 text-purple-600" />
                  <div>
                    <h3 className="font-medium">Atualizar Cache</h3>
                    <p className="text-sm text-gray-600">
                      Recalcular dependências do sistema
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}