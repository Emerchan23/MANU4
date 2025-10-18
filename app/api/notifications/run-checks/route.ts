import { NextResponse } from 'next/server'
import { getNotificationIntegrationService } from '@/lib/notification-integrations'

// POST - Executa verificações de notificações imediatamente
export async function POST() {
  try {
    const service = getNotificationIntegrationService()
    await service.runAllChecks()
    return NextResponse.json({ success: true, message: 'Verificações de notificações executadas' })
  } catch (error) {
    console.error('❌ API - Erro ao executar verificações de notificações:', error)
    return NextResponse.json({ success: false, error: 'Falha ao executar verificações' }, { status: 500 })
  }
}