'use client';

import React from 'react';
import { AlertTriangle, Eye, Power, X } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';

interface DependencyInfo {
  entity: string;
  entityDisplayName: string;
  count: number;
  records?: any[];
  foreignKey: string;
  relationshipType: string;
}

interface DependencyAlertProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  dependencies: DependencyInfo[];
  totalCount: number;
  customMessages?: Record<string, string>;
  onViewDependencies?: () => void;
  onDeactivateInstead?: () => void;
  onConfirmDelete?: () => void;
  showDeactivateOption?: boolean;
  showForceDeleteOption?: boolean;
}

export function DependencyAlert({
  isOpen,
  onClose,
  entityName,
  dependencies,
  totalCount,
  customMessages = {},
  onViewDependencies,
  onDeactivateInstead,
  onConfirmDelete,
  showDeactivateOption = true,
  showForceDeleteOption = false
}: DependencyAlertProps) {
  if (!isOpen) return null;

  const formatDependencyMessage = (dep: DependencyInfo) => {
    const customMessage = customMessages[dep.entity];
    if (customMessage) {
      return customMessage.replace('{count}', dep.count.toString());
    }
    
    const count = dep.count;
    const plural = count > 1 ? 's' : '';
    return `${dep.entityDisplayName}: ${count} registro${plural} vinculado${plural}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-red-50">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900">
                Exclusão não permitida
              </h3>
              <p className="text-sm text-red-700">
                Registros vinculados encontrados
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-red-600 hover:text-red-800 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <p className="text-gray-700 mb-4">
            Não é possível excluir <strong>{entityName}</strong> pois possui registros vinculados:
          </p>

          <div className="space-y-3">
            {dependencies.map((dep, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {formatDependencyMessage(dep)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Relacionamento: {dep.foreignKey}
                  </p>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {dep.count}
                </Badge>
              </div>
            ))}
          </div>

          {totalCount > dependencies.length && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Total:</strong> {totalCount} registros vinculados encontrados
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col space-y-2">
            {onViewDependencies && (
              <Button
                onClick={onViewDependencies}
                variant="outline"
                className="w-full justify-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Registros Vinculados
              </Button>
            )}

            {showDeactivateOption && onDeactivateInstead && (
              <Button
                onClick={onDeactivateInstead}
                variant="outline"
                className="w-full justify-center text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                <Power className="h-4 w-4 mr-2" />
                Desativar ao Invés de Excluir
              </Button>
            )}

            {showForceDeleteOption && onConfirmDelete && (
              <Button
                onClick={onConfirmDelete}
                variant="destructive"
                className="w-full justify-center"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Forçar Exclusão (Perigoso)
              </Button>
            )}

            <Button
              onClick={onClose}
              variant="secondary"
              className="w-full justify-center"
            >
              Cancelar
            </Button>
          </div>

          <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <strong>Dica:</strong> Para excluir este registro, primeiro remova ou transfira os registros vinculados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}