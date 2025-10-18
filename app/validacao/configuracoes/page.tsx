'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Settings, Save, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

interface ValidationRule {
  id: number;
  entity_type: string;
  rule_type: string;
  rule_config: any;
  custom_message?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ValidationConfigPage() {
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRule, setEditingRule] = useState<ValidationRule | null>(null);

  const entityTypes = [
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

  const ruleTypes = [
    { value: 'prevent_delete', label: 'Impedir Exclusão' },
    { value: 'cascade_delete', label: 'Exclusão em Cascata' },
    { value: 'require_confirmation', label: 'Exigir Confirmação' },
    { value: 'suggest_alternative', label: 'Sugerir Alternativa' }
  ];

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/validation/rules');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar regras de validação');
      }
      
      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error('Error fetching validation rules:', error);
      toast.error('Erro ao carregar regras de validação');
    } finally {
      setLoading(false);
    }
  };

  const saveRule = async (rule: Partial<ValidationRule>) => {
    try {
      setSaving(true);
      const method = rule.id ? 'PUT' : 'POST';
      const response = await fetch('/api/validation/rules', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rule),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar regra');
      }

      toast.success(rule.id ? 'Regra atualizada com sucesso!' : 'Regra criada com sucesso!');
      setEditingRule(null);
      fetchRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error('Erro ao salvar regra');
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (entityType: string) => {
    try {
      const response = await fetch(`/api/validation/rules?entityType=${entityType}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir regra');
      }

      toast.success('Regra excluída com sucesso!');
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Erro ao excluir regra');
    }
  };

  const refreshCache = async () => {
    try {
      const response = await fetch('/api/validation/cache/refresh', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar cache');
      }

      toast.success('Cache atualizado com sucesso!');
    } catch (error) {
      console.error('Error refreshing cache:', error);
      toast.error('Erro ao atualizar cache');
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const getEntityLabel = (entityType: string) => {
    return entityTypes.find(et => et.value === entityType)?.label || entityType;
  };

  const getRuleTypeLabel = (ruleType: string) => {
    return ruleTypes.find(rt => rt.value === ruleType)?.label || ruleType;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configurações de Validação
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure as regras de integridade referencial para diferentes tipos de entidades
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshCache} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Cache
          </Button>
          <Button onClick={() => setEditingRule({} as ValidationRule)}>
            <Settings className="h-4 w-4 mr-2" />
            Nova Regra
          </Button>
        </div>
      </div>

      {/* Regras Existentes */}
      <Card>
        <CardHeader>
          <CardTitle>Regras de Validação Ativas</CardTitle>
          <CardDescription>
            Gerencie as regras de integridade referencial para cada tipo de entidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando regras...</span>
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma regra de validação configurada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{getEntityLabel(rule.entity_type)}</Badge>
                      <Badge variant={rule.is_active ? "default" : "secondary"}>
                        {rule.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <p className="font-medium">{getRuleTypeLabel(rule.rule_type)}</p>
                    {rule.custom_message && (
                      <p className="text-sm text-muted-foreground mt-1">{rule.custom_message}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRule(rule)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteRule(rule.entity_type)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      {editingRule && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingRule.id ? 'Editar Regra' : 'Nova Regra'}
            </CardTitle>
            <CardDescription>
              Configure os parâmetros da regra de validação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="entity_type">Tipo de Entidade</Label>
                <select
                  id="entity_type"
                  className="w-full p-2 border rounded-md"
                  value={editingRule.entity_type || ''}
                  onChange={(e) => setEditingRule({
                    ...editingRule,
                    entity_type: e.target.value
                  })}
                >
                  <option value="">Selecione...</option>
                  {entityTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="rule_type">Tipo de Regra</Label>
                <select
                  id="rule_type"
                  className="w-full p-2 border rounded-md"
                  value={editingRule.rule_type || ''}
                  onChange={(e) => setEditingRule({
                    ...editingRule,
                    rule_type: e.target.value
                  })}
                >
                  <option value="">Selecione...</option>
                  {ruleTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="custom_message">Mensagem Personalizada</Label>
              <Textarea
                id="custom_message"
                placeholder="Mensagem exibida quando a regra é aplicada..."
                value={editingRule.custom_message || ''}
                onChange={(e) => setEditingRule({
                  ...editingRule,
                  custom_message: e.target.value
                })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={editingRule.is_active ?? true}
                onCheckedChange={(checked) => setEditingRule({
                  ...editingRule,
                  is_active: checked
                })}
              />
              <Label htmlFor="is_active">Regra ativa</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => saveRule(editingRule)}
                disabled={saving || !editingRule.entity_type || !editingRule.rule_type}
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingRule.id ? 'Atualizar' : 'Criar'} Regra
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingRule(null)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{rules.filter(r => r.is_active).length}</p>
              <p className="text-sm text-muted-foreground">Regras Ativas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{entityTypes.length}</p>
              <p className="text-sm text-muted-foreground">Tipos de Entidade</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{ruleTypes.length}</p>
              <p className="text-sm text-muted-foreground">Tipos de Regra</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}