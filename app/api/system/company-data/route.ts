import { NextRequest, NextResponse } from 'next/server'
import { createPool } from '../../../../lib/database.js'
import { SystemSettingsRow, CompanyDataRow } from '../../../../types/database'

export async function GET() {
  try {
    const pool = createPool()
    const [rows] = await pool.execute(
      `SELECT setting_key, setting_value FROM system_settings 
       WHERE setting_key IN (
         'company_name', 'company_legal_name', 'company_phone', 
         'company_email', 'company_cnpj', 'company_address'
       )`
    )
    
    // Converter os dados do banco para o formato esperado pelo frontend
    const settings: Record<string, string> = {}
    ;(rows as SystemSettingsRow[]).forEach((row: SystemSettingsRow) => {
      settings[row.setting_key] = row.setting_value
    })
    
    // Estruturar os dados no formato da interface CompanyData
    const companyData = {
      id: '1', // ID fixo para empresa principal
      name: settings.company_name || '',
      legalName: settings.company_legal_name || '',
      phone: settings.company_phone || '',
      email: settings.company_email || '',
      cnpj: settings.company_cnpj || '',
      address: settings.company_address ? JSON.parse(settings.company_address) : {
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: ''
      },
      logo: settings.company_logo || '',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    return NextResponse.json({
      success: true,
      data: companyData
    })
  } catch (error) {
    console.error('Erro ao buscar dados da empresa:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('Dados da empresa recebidos:', data)
    
    const pool = createPool()
    
    // Preparar os dados para salvar no system_settings
    const settingsToSave: [string, string][] = [
      ['company_name', data.name || ''],
      ['company_legal_name', data.legalName || ''],
      ['company_phone', data.phone || ''],
      ['company_email', data.email || ''],
      ['company_cnpj', data.cnpj || ''],
      ['company_address', JSON.stringify(data.address || {})],
      ['company_logo', data.logo || '']
    ]
    
    // Salvar cada configuração no banco
    for (const [key, value] of settingsToSave) {
      await pool.execute(
        `INSERT INTO system_settings (setting_key, setting_value, updated_at) 
         VALUES (?, ?, NOW()) 
         ON DUPLICATE KEY UPDATE 
         setting_value = VALUES(setting_value), 
         updated_at = VALUES(updated_at)`,
        [key, value]
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Dados da empresa salvos com sucesso',
      data: data
    })
  } catch (error) {
    console.error('Erro ao salvar dados da empresa:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}