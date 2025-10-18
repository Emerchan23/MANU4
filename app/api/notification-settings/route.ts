import { NextRequest, NextResponse } from 'next/server'

// Simulação de armazenamento em memória (em produção, usar banco de dados)
let notificationConfig = {
  pushEnabled: true,
  maintenanceAlerts: true,
  criticalEquipmentAlerts: true,
  overdueMaintenanceAlerts: true,
  calibrationReminders: true,
  systemAlerts: false
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(notificationConfig)
  } catch (error) {
    console.error('Erro ao buscar configurações de notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { settings } = body
    const { pushEnabled, maintenanceAlerts, criticalEquipmentAlerts, overdueMaintenanceAlerts, calibrationReminders, systemAlerts } = settings

    // Atualizar configurações em memória
    notificationConfig = {
      pushEnabled: Boolean(pushEnabled),
      maintenanceAlerts: Boolean(maintenanceAlerts),
      criticalEquipmentAlerts: Boolean(criticalEquipmentAlerts),
      overdueMaintenanceAlerts: Boolean(overdueMaintenanceAlerts),
      calibrationReminders: Boolean(calibrationReminders),
      systemAlerts: Boolean(systemAlerts)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Configurações salvas com sucesso!',
      config: notificationConfig
    })
  } catch (error) {
    console.error('Erro ao salvar configurações de notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}