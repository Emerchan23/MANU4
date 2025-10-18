'use client';

import React, { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from './button';
import { DependencyAlert } from './dependency-alert';
import { useReferentialIntegrity } from '@/hooks/useReferentialIntegrity';

interface ValidationDeleteButtonProps {
  entityType: string;
  entityId: number;
  entityName: string;
  onDelete: () => Promise<void>;
  onDeactivate?: () => Promise<void>;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  showDeactivateOption?: boolean;
  children?: React.ReactNode;
}

export function ValidationDeleteButton({
  entityType,
  entityId,
  entityName,
  onDelete,
  onDeactivate,
  disabled = false,
  size = 'sm',
  variant = 'destructive',
  className,
  showDeactivateOption = true,
  children
}: ValidationDeleteButtonProps) {
  const [showAlert, setShowAlert] = useState(false);
  
  const {
    isValidating,
    validationResult,
    validateAndDelete
  } = useReferentialIntegrity({
    entityType,
    onNavigateToEntity: (entityType, entityId) => {
      window.open(`/validacao/dependencias/${entityType}/${entityId}`, '_blank');
    },
    onDeactivateInstead: onDeactivate
  });

  const handleDeleteClick = async () => {
    const success = await validateAndDelete(entityId, onDelete, entityName);
    
    if (!success && validationResult && !validationResult.canDelete) {
      setShowAlert(true);
    }
  };

  const handleViewDependencies = () => {
    window.open(`/validacao/dependencias/${entityType}/${entityId}`, '_blank');
    setShowAlert(false);
  };

  const handleDeactivateInstead = async () => {
    if (onDeactivate) {
      try {
        await onDeactivate();
        setShowAlert(false);
      } catch (error) {
        console.error('Erro ao desativar:', error);
      }
    }
  };

  return (
    <>
      <Button
        onClick={handleDeleteClick}
        disabled={disabled || isValidating}
        size={size}
        variant={variant}
        className={className}
      >
        {isValidating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Trash2 className="h-4 w-4" />
            {children}
          </>
        )}
      </Button>

      {validationResult && !validationResult.canDelete && (
        <DependencyAlert
          isOpen={showAlert}
          onClose={() => setShowAlert(false)}
          entityName={entityName}
          dependencies={validationResult.dependencies}
          totalCount={validationResult.totalCount}
          customMessages={validationResult.customMessages}
          onViewDependencies={handleViewDependencies}
          onDeactivateInstead={showDeactivateOption && onDeactivate ? handleDeactivateInstead : undefined}
          showDeactivateOption={showDeactivateOption && !!onDeactivate}
        />
      )}
    </>
  );
}