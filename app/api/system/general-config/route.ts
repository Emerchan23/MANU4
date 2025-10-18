import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise'

interface SystemSettingsRow extends RowDataPacket {
  id: number
  setting_key: string
  setting_value: string | null
  setting_type: string
  category: string
  description: string | null
  is_locked: number
  updated_by: number | null
  created_at: Date
  updated_at: Date
}

export async function GET() {
  try {
    const [rows] = await pool.execute<SystemSettingsRow[]>(
      `SELECT setting_key, setting_value, setting_type, category, is_locked, description
       FROM system_settings
       WHERE category = 'geral' OR category = 'notificacoes'
       ORDER BY category, setting_key`
    )

    // Converter os dados do banco para o formato esperado pelo frontend
    const settings: Record<string, any> = {}
    const lockedSettings: Record<string, boolean> = {}

    rows.forEach((row) => {
      const key = row.setting_key
      let value: any = row.setting_value

      // Converter valores baseado no tipo
      if (row.setting_type === 'boolean') {
        value = value === 'true' || value === '1'
      } else if (row.setting_type === 'number') {
        value = value ? Number(value) : 0
      } else if (row.setting_type === 'json' && value) {
        try {
          value = JSON.parse(value)
        } catch (e) {
          console.error('Erro ao parsear JSON:', e)
        }
      }

      // Mapear nomes do banco para nomes do frontend
      const keyMapping: Record<string, string> = {
        'notification_maintenance_days': 'maintenanceAlertDays',
        'notification_warranty_days': 'calibrationAlertDays',
        'auto_check_interval_hours': 'autoCheckInterval',
        'maintenance_mode': 'maintenanceMode',
        'auto_backup': 'autoBackup',
        'detailed_logs': 'detailedLogs',
        'items_per_page': 'itemsPerPage',
        'session_timeout_minutes': 'sessionTimeout',
        'notification_enabled': 'notificationEnabled'
      }

      const frontendKey = keyMapping[key] || key
      settings[frontendKey] = value
      lockedSettings[frontendKey] = Boolean(row.is_locked)
    })

    // Valores padrão caso não existam no banco
    const defaultSettings = {
      maintenanceAlertDays: 7,
      calibrationAlertDays: 15,
      autoCheckInterval: 24,
      maintenanceMode: false,
      autoBackup: true,
      detailedLogs: false,
      itemsPerPage: 25,
      sessionTimeout: 30,
      notificationEnabled: true
    }

    const finalSettings = { ...defaultSettings, ...settings }

    return NextResponse.json({
      success: true,
      data: finalSettings,
      locked: lockedSettings
    })
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar configurações' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('Dados recebidos:', data)

    // Mapear nomes do frontend para nomes do banco
    const keyMapping: Record<string, string> = {
      'maintenanceAlertDays': 'notification_maintenance_days',
      'calibrationAlertDays': 'notification_warranty_days',
      'autoCheckInterval': 'auto_check_interval_hours',
      'maintenanceMode': 'maintenance_mode',
      'autoBackup': 'auto_backup',
      'detailedLogs': 'detailed_logs',
      'itemsPerPage': 'items_per_page',
      'sessionTimeout': 'session_timeout_minutes',
      'notificationEnabled': 'notification_enabled'
    }

    // Verificar quais configurações estão bloqueadas
    const [lockedRows] = await pool.execute<SystemSettingsRow[]>(
      'SELECT setting_key FROM system_settings WHERE is_locked = 1'
    )
    const lockedKeys = new Set(lockedRows.map(row => row.setting_key))

    // Salvar cada configuração no banco
    for (const [frontendKey, value] of Object.entries(data)) {
      const dbKey = keyMapping[frontendKey] || frontendKey

      // Verificar se a configuração está bloqueada
      if (lockedKeys.has(dbKey)) {
        console.log(`Configuração ${dbKey} está bloqueada, pulando...`)
        continue
      }

      const stringValue = String(value)
      const settingType = typeof value === 'boolean' ? 'boolean' :
                         typeof value === 'number' ? 'number' : 'string'

      await pool.execute(
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, category, updated_at)
         VALUES (?, ?, ?, 'geral', NOW())
         ON DUPLICATE KEY UPDATE
         setting_value = VALUES(setting_value),
         setting_type = VALUES(setting_type),
         updated_at = NOW()`,
        [dbKey, stringValue, settingType]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso'
    })
  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao salvar configurações' },
      { status: 500 }
    )
  }
}

// Nova rota para bloquear/desbloquear configurações
export async function PATCH(request: NextRequest) {
  try {
    const { settingKey, isLocked } = await request.json()

    if (!settingKey) {
      return NextResponse.json(
        { success: false, error: 'settingKey é obrigatório' },
        { status: 400 }
      )
    }

    await pool.execute(
      'UPDATE system_settings SET is_locked = ? WHERE setting_key = ?',
      [isLocked ? 1 : 0, settingKey]
    )

    return NextResponse.json({
      success: true,
      message: `Configuração ${isLocked ? 'bloqueada' : 'desbloqueada'} com sucesso`
    })
  } catch (error) {
    console.error('Erro ao atualizar bloqueio:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar bloqueio' },
      { status: 500 }
    )
  }
}