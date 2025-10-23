'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { ConfirmationModal } from './confirmation-modal'
import { useCompleteService } from '@/hooks/use-complete-service'
import { toast } from 'sonner'

interface CompleteServiceButtonProps {
  orderId: number
  orderNumber: string
  equipmentName: string
  currentStatus: string
  onComplete: (orderId: number) => void
}

export function CompleteServiceButton({
  orderId,
  orderNumber,
  equipmentName,
  currentStatus,
  onComplete
}: CompleteServiceButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const { completeService, isCompleting, error } = useCompleteService()

  // Só mostra o botão para ordens ABERTA ou EM_ANDAMENTO
  if (currentStatus !== 'ABERTA' && currentStatus !== 'EM_ANDAMENTO') {
    return null
  }

  const handleClick = () => {
    setShowModal(true)
  }

  const handleConfirm = async () => {
    try {
      await completeService(orderId)
      setShowModal(false)
      onComplete(orderId)
      toast.success('Ordem concluída com sucesso!')
    } catch (err) {
      console.error('Erro ao concluir ordem:', err)
      toast.error('Erro ao concluir ordem de serviço')
    }
  }

  const handleCancel = () => {
    setShowModal(false)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        className="bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600 shadow-lg hover:shadow-xl transition-all duration-200"
        title="Concluir Serviço"
        disabled={isCompleting}
      >
        <Check className="h-4 w-4" />
      </Button>

      <ConfirmationModal
        isOpen={showModal}
        orderNumber={orderNumber}
        equipmentName={equipmentName}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isLoading={isCompleting}
      />
    </>
  )
}