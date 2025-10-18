import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../../../lib/database.js'

// GET /api/pdf/settings - Buscar configurações PDF
export async function GET(request: NextRequest) {
  try {
    const settings = await query(
      `SELECT setting_key, setting_value, description 
       FROM system_settings 
       WHERE setting_key LIKE 'pdf_%' 
       ORDER BY setting_key`
    )
    
    // Converter para objeto mais fácil de usar
    const settingsObj: Record<string, any> = {}
    settings.forEach((setting: any) => {
      try {
        settingsObj[setting.setting_key] = JSON.parse(setting.setting_value)
      } catch {
        settingsObj[setting.setting_key] = setting.setting_value
      }
    })
    
    return NextResponse.json({
      success: true,
      settings: settingsObj
    })
  } catch (error) {
    console.error('Erro ao buscar configurações PDF:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/pdf/settings - Atualizar configurações PDF
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { settings } = body
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Configurações são obrigatórias' },
        { status: 400 }
      )
    }
    
    // Atualizar cada configuração
    for (const [key, value] of Object.entries(settings)) {
      if (!key.startsWith('pdf_')) {
        continue // Só permitir configurações PDF
      }
      
      const settingValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
      
      await query(
        `INSERT INTO system_settings (setting_key, setting_value) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
        [key, settingValue]
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Configurações atualizadas com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar configurações PDF:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/pdf/settings - Atualizar configuração específica
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value } = body
    
    if (!key || !key.startsWith('pdf_')) {
      return NextResponse.json(
        { error: 'Chave de configuração PDF inválida' },
        { status: 400 }
      )
    }
    
    const settingValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
    
    await query(
      `INSERT INTO system_settings (setting_key, setting_value) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
      [key, settingValue]
    )
    
    return NextResponse.json({
      success: true,
      message: 'Configuração atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}