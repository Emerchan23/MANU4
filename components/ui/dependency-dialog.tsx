"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ExclamationTriangleIcon, InformationCircleIcon } from "@heroicons/react/24/outline"
import type { DependencyCheck } from "@/lib/dependency-checker"

interface DependencyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dependencyCheck: DependencyCheck | null
  itemName: string
  itemType: string
  onConfirmDelete?: () => void
}

export function DependencyDialog({
  open,
  onOpenChange,
  dependencyCheck,
  itemName,
  itemType,
  onConfirmDelete,
}: DependencyDialogProps) {
  if (!dependencyCheck) return null

  const handleConfirm = () => {
    if (onConfirmDelete) {
      onConfirmDelete()
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {dependencyCheck.canDelete ? (
              <InformationCircleIcon className="h-5 w-5 text-blue-500" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            )}
            {dependencyCheck.canDelete ? "Confirmar Exclusão" : "Exclusão Bloqueada"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!dependencyCheck.canDelete && (
            <Alert className="border-red-200 bg-red-50">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700">
                <strong>{itemName}</strong> não pode ser excluído devido às dependências abaixo.
              </AlertDescription>
            </Alert>
          )}

          {dependencyCheck.blockedBy.map((block, index) => (
            <div key={index} className="space-y-3">
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <h4 className="font-medium text-red-800 mb-2">{block.message}</h4>
                <p className="text-sm text-red-700 mb-3">{block.actionRequired}</p>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-red-600">Itens vinculados:</p>
                  <div className="flex flex-wrap gap-2">
                    {block.items.map((item) => (
                      <Badge key={item.id} variant="destructive" className="text-xs">
                        {item.name} {item.description && `(${item.description})`}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {dependencyCheck.cascadeDeletes && dependencyCheck.cascadeDeletes.length > 0 && (
            <div className="space-y-3">
              <Alert className="border-yellow-200 bg-yellow-50">
                <InformationCircleIcon className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Atenção:</strong> A exclusão deste {itemType} também excluirá os itens relacionados abaixo.
                </AlertDescription>
              </Alert>

              {dependencyCheck.cascadeDeletes.map((cascade, index) => (
                <div key={index} className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                  <h4 className="font-medium text-yellow-800 mb-2">
                    {cascade.count} {cascade.type} será(ão) excluído(s):
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {cascade.items.map((item) => (
                      <Badge key={item.id} variant="secondary" className="text-xs">
                        {item.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {dependencyCheck.canDelete ? "Cancelar" : "Entendi"}
          </Button>
          {dependencyCheck.canDelete && onConfirmDelete && (
            <Button variant="destructive" onClick={handleConfirm}>
              Confirmar Exclusão
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
