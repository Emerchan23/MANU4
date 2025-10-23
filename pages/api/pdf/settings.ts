import { NextApiRequest, NextApiResponse } from 'next'
import mysql from 'mysql2/promise'

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sis_manu',
  port: parseInt(process.env.DB_PORT || '3306'),
}

interface PDFSettings {
  // Cabeçalho
  header_enabled: boolean
  header_title: string
  header_subtitle: string
  header_bg_color: string
  header_text_color: string
  header_height: number
  header_font_size: number
  header_subtitle_font_size: number

  // Logo
  logo_enabled: boolean
  logo_width: number
  logo_height: number
  logo_margin_x: number
  logo_margin_y: number

  // Empresa
  company_name: string
  company_cnpj: string
  company_address: string
  company_phone: string
  company_email: string

  // Cores
  primary_color: string
  secondary_color: string
  text_color: string
  border_color: string

  // Rodapé
  footer_enabled: boolean
  footer_text: string
  footer_bg_color: string
  footer_text_color: string
  footer_height: number

  // Layout
  show_date: boolean
  show_page_numbers: boolean
  margin_top: number
  margin_bottom: number
  margin_left: number
  margin_right: number

  // Assinaturas
  signature_enabled: boolean
  signature_field1_label: string
  signature_field2_label: string
}

const defaultSettings: PDFSettings = {
  // Cabeçalho
  header_enabled: true,
  header_title: 'ORDEM DE SERVIÇO',
  header_subtitle: 'Sistema de Manutenção',
  header_bg_color: '#3b82f6',
  header_text_color: '#ffffff',
  header_height: 80,
  header_font_size: 24,
  header_subtitle_font_size: 14,

  // Logo
  logo_enabled: true,
  logo_width: 60,
  logo_height: 60,
  logo_margin_x: 10,
  logo_margin_y: 10,

  // Empresa
  company_name: 'Sua Empresa',
  company_cnpj: '00.000.000/0000-00',
  company_address: 'Endereço da empresa',
  company_phone: '(00) 0000-0000',
  company_email: 'contato@empresa.com',

  // Cores
  primary_color: '#3b82f6',
  secondary_color: '#10b981',
  text_color: '#1f2937',
  border_color: '#e5e7eb',

  // Rodapé
  footer_enabled: true,
  footer_text: 'Documento gerado automaticamente pelo sistema',
  footer_bg_color: '#f3f4f6',
  footer_text_color: '#6b7280',
  footer_height: 40,

  // Layout
  show_date: true,
  show_page_numbers: true,
  margin_top: 20,
  margin_bottom: 20,
  margin_left: 20,
  margin_right: 20,

  // Assinaturas
  signature_enabled: true,
  signature_field1_label: 'Responsável pela Execução',
  signature_field2_label: 'Supervisor/Aprovador',
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res)
  } else if (req.method === 'POST') {
    return handlePost(req, res)
  } else {
    return res.status(405).json({ success: false, error: 'Método não permitido' })
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  let connection

  try {
    connection = await mysql.createConnection(dbConfig)

    // Verificar se a tabela existe, se não, criar
    await ensureTableExists(connection)

    // Buscar configurações
    const [rows] = await connection.execute(
      'SELECT * FROM pdf_settings ORDER BY id DESC LIMIT 1'
    )

    const settings = Array.isArray(rows) && rows.length > 0 
      ? { ...defaultSettings, ...rows[0] }
      : defaultSettings

    return res.status(200).json({
      success: true,
      settings
    })

  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  let connection

  try {
    const { settings } = req.body

    if (!settings) {
      return res.status(400).json({
        success: false,
        error: 'Configurações não fornecidas'
      })
    }

    connection = await mysql.createConnection(dbConfig)

    // Verificar se a tabela existe, se não, criar
    await ensureTableExists(connection)

    // Preparar dados para inserção/atualização
    const settingsData = { ...defaultSettings, ...settings }

    // Verificar se já existe uma configuração
    const [existingRows] = await connection.execute(
      'SELECT id FROM pdf_settings ORDER BY id DESC LIMIT 1'
    )

    if (Array.isArray(existingRows) && existingRows.length > 0) {
      // Atualizar configuração existente
      const existingId = (existingRows[0] as any).id

      const updateFields = Object.keys(settingsData).map(key => `${key} = ?`).join(', ')
      const updateValues = Object.values(settingsData)

      await connection.execute(
        `UPDATE pdf_settings SET ${updateFields}, updated_at = NOW() WHERE id = ?`,
        [...updateValues, existingId]
      )
    } else {
      // Inserir nova configuração
      const insertFields = Object.keys(settingsData).join(', ')
      const insertPlaceholders = Object.keys(settingsData).map(() => '?').join(', ')
      const insertValues = Object.values(settingsData)

      await connection.execute(
        `INSERT INTO pdf_settings (${insertFields}, created_at, updated_at) VALUES (${insertPlaceholders}, NOW(), NOW())`,
        insertValues
      )
    }

    // Buscar configuração atualizada
    const [updatedRows] = await connection.execute(
      'SELECT * FROM pdf_settings ORDER BY id DESC LIMIT 1'
    )

    const updatedSettings = Array.isArray(updatedRows) && updatedRows.length > 0 
      ? updatedRows[0] 
      : settingsData

    return res.status(200).json({
      success: true,
      message: 'Configurações salvas com sucesso',
      settings: updatedSettings
    })

  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

async function ensureTableExists(connection: mysql.Connection) {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS pdf_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      
      -- Cabeçalho
      header_enabled BOOLEAN DEFAULT TRUE,
      header_title VARCHAR(255) DEFAULT 'ORDEM DE SERVIÇO',
      header_subtitle VARCHAR(255) DEFAULT 'Sistema de Manutenção',
      header_bg_color VARCHAR(7) DEFAULT '#3b82f6',
      header_text_color VARCHAR(7) DEFAULT '#ffffff',
      header_height INT DEFAULT 80,
      header_font_size INT DEFAULT 24,
      header_subtitle_font_size INT DEFAULT 14,
      
      -- Logo
      logo_enabled BOOLEAN DEFAULT TRUE,
      logo_width INT DEFAULT 60,
      logo_height INT DEFAULT 60,
      logo_margin_x INT DEFAULT 10,
      logo_margin_y INT DEFAULT 10,
      
      -- Empresa
      company_name VARCHAR(255) DEFAULT 'Sua Empresa',
      company_cnpj VARCHAR(20) DEFAULT '00.000.000/0000-00',
      company_address TEXT DEFAULT 'Endereço da empresa',
      company_phone VARCHAR(20) DEFAULT '(00) 0000-0000',
      company_email VARCHAR(255) DEFAULT 'contato@empresa.com',
      
      -- Cores
      primary_color VARCHAR(7) DEFAULT '#3b82f6',
      secondary_color VARCHAR(7) DEFAULT '#10b981',
      text_color VARCHAR(7) DEFAULT '#1f2937',
      border_color VARCHAR(7) DEFAULT '#e5e7eb',
      
      -- Rodapé
      footer_enabled BOOLEAN DEFAULT TRUE,
      footer_text TEXT DEFAULT 'Documento gerado automaticamente pelo sistema',
      footer_bg_color VARCHAR(7) DEFAULT '#f3f4f6',
      footer_text_color VARCHAR(7) DEFAULT '#6b7280',
      footer_height INT DEFAULT 40,
      
      -- Layout
      show_date BOOLEAN DEFAULT TRUE,
      show_page_numbers BOOLEAN DEFAULT TRUE,
      margin_top INT DEFAULT 20,
      margin_bottom INT DEFAULT 20,
      margin_left INT DEFAULT 20,
      margin_right INT DEFAULT 20,
      
      -- Assinaturas
      signature_enabled BOOLEAN DEFAULT TRUE,
      signature_field1_label VARCHAR(255) DEFAULT 'Responsável pela Execução',
      signature_field2_label VARCHAR(255) DEFAULT 'Supervisor/Aprovador',
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `

  await connection.execute(createTableQuery)
}