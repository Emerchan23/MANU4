import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance'
}

export async function GET() {
  try {
    const connection = await mysql.createConnection(dbConfig)
    
    const [rows] = await connection.execute(`
      SELECT setting_key, setting_value 
      FROM system_settings 
      WHERE category = 'personalization'
    `)
    
    await connection.end()
    
    // Converter os dados do banco para o formato esperado pelo frontend
    const settings: Record<string, any> = {}
    ;(rows as any[]).forEach((row: any) => {
      const key = row.setting_key
      let value: any = row.setting_value
      
      // Converter valores booleanos e numéricos
      if (value === 'true') value = true
      else if (value === 'false') value = false
      else if (!isNaN(value) && value !== '') value = Number(value)
      
      settings[key] = value
    })
    
    // Valores padrão caso não existam no banco
    const defaultSettings = {
      primary_color: '#3b82f6',
      interface_density: 'comfortable',
      border_radius: '10',
      animations_enabled: 'true',
      sidebar_compact: 'false',
      show_breadcrumbs: 'true',
      high_contrast: 'false'
    }
    
    // Mesclar configurações padrão com as do banco
    const finalSettings = { ...defaultSettings, ...settings }
    
    return NextResponse.json({
      success: true,
      data: finalSettings
    })
  } catch (error) {
    console.error('Erro ao buscar configurações globais:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar configurações globais',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Aceitar tanto formato { settings: {...} } quanto formato direto {...}
    const settings = body.settings || body
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Formato inválido. Esperado: { key: value, ... } ou { settings: { key: value, ... } }' },
        { status: 400 }
      )
    }
    
    const connection = await mysql.createConnection(dbConfig)
    
    // Process settings
    for (const [key, value] of Object.entries(settings)) {
      // Check if setting exists
      const [existing] = await connection.execute(`
        SELECT id FROM system_settings 
        WHERE setting_key = ? AND category = 'personalization'
      `, [key])
      
      if ((existing as any[]).length === 0) {
        // Insert new setting
        await connection.execute(`
          INSERT INTO system_settings (setting_key, setting_value, category, description)
          VALUES (?, ?, 'personalization', ?)
        `, [key, String(value), `Configuração de personalização: ${key}`])
      } else {
        // Update existing setting
        await connection.execute(`
          UPDATE system_settings 
          SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
          WHERE setting_key = ? AND category = 'personalization'
        `, [String(value), key])
      }
    }
    
    await connection.end()
    
    return NextResponse.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      updated_count: Object.keys(settings).length
    })
  } catch (error) {
    console.error('Erro ao atualizar configurações globais:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao atualizar configurações globais',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}