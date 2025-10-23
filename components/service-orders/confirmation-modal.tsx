'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Check, X, AlertTriangle } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  orderNumber: string
  equipmentName: string
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}

export function ConfirmationModal({
  isOpen,
  orderNumber,
  equipmentName,
  onConfirm,
  onCancel,
  isLoading
}: ConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirmar Conclusão
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja marcar esta ordem como concluída?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-3">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-medium text-sm text-gray-600">Ordem:</span>
              <span className="text-sm font-semibold">{orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-sm text-gray-600">Equipamento:</span>
              <span className="text-sm">{equipmentName}</span>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Esta ação irá:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
              <li>Alterar o status para "CONCLUÍDA"</li>
              <li>Registrar a data e hora de conclusão</li>
              <li>Remover o botão de conclusão da interface</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {isLoading ? 'Concluindo...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}