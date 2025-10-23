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

interface CompanyData {
  id?: number
  name: string
  cnpj: string
  address: string
  phone: string
  email: string
  website?: string
  created_at?: string
  updated_at?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res)
      case 'POST':
        return await handlePost(req, res)
      case 'PUT':
        return await handlePut(req, res)
      default:
        return res.status(405).json({ error: 'Método não permitido' })
    }
  } catch (error) {
    console.error('Erro na API de dados da empresa:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const connection = await mysql.createConnection(dbConfig)
  
  try {
    await ensureTableExists(connection)
    
    const [rows] = await connection.execute(
      'SELECT * FROM company_data ORDER BY id DESC LIMIT 1'
    )
    
    const companies = rows as CompanyData[]
    
    if (companies.length === 0) {
      // Retorna dados padrão se não houver empresa cadastrada
      const defaultCompany: CompanyData = {
        name: 'Sua Empresa',
        cnpj: '00.000.000/0000-00',
        address: 'Endereço da empresa',
        phone: '(00) 0000-0000',
        email: 'contato@empresa.com',
        website: ''
      }
      return res.status(200).json(defaultCompany)
    }
    
    return res.status(200).json(companies[0])
  } catch (error) {
    console.error('Erro ao buscar dados da empresa:', error)
    return res.status(500).json({ error: 'Erro ao buscar dados da empresa' })
  } finally {
    await connection.end()
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const connection = await mysql.createConnection(dbConfig)
  
  try {
    await ensureTableExists(connection)
    
    const { name, cnpj, address, phone, email, website } = req.body
    
    // Validações
    if (!name || !cnpj || !address || !phone || !email) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: nome, CNPJ, endereço, telefone e email' 
      })
    }
    
    // Validação básica de CNPJ (formato)
    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
    if (!cnpjRegex.test(cnpj)) {
      return res.status(400).json({ 
        error: 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX' 
      })
    }
    
    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Email deve ter um formato válido' 
      })
    }
    
    const [result] = await connection.execute(
      `INSERT INTO company_data (name, cnpj, address, phone, email, website, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, cnpj, address, phone, email, website || '']
    )
    
    const insertResult = result as mysql.ResultSetHeader
    
    return res.status(201).json({
      message: 'Dados da empresa salvos com sucesso',
      id: insertResult.insertId
    })
  } catch (error) {
    console.error('Erro ao salvar dados da empresa:', error)
    return res.status(500).json({ error: 'Erro ao salvar dados da empresa' })
  } finally {
    await connection.end()
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const connection = await mysql.createConnection(dbConfig)
  
  try {
    await ensureTableExists(connection)
    
    const { id, name, cnpj, address, phone, email, website } = req.body
    
    // Validações
    if (!name || !cnpj || !address || !phone || !email) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: nome, CNPJ, endereço, telefone e email' 
      })
    }
    
    // Validação básica de CNPJ (formato)
    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
    if (!cnpjRegex.test(cnpj)) {
      return res.status(400).json({ 
        error: 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX' 
      })
    }
    
    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Email deve ter um formato válido' 
      })
    }
    
    if (id) {
      // Atualizar registro existente
      await connection.execute(
        `UPDATE company_data 
         SET name = ?, cnpj = ?, address = ?, phone = ?, email = ?, website = ?, updated_at = NOW()
         WHERE id = ?`,
        [name, cnpj, address, phone, email, website || '', id]
      )
    } else {
      // Criar novo registro se não existir ID
      const [result] = await connection.execute(
        `INSERT INTO company_data (name, cnpj, address, phone, email, website, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [name, cnpj, address, phone, email, website || '']
      )
    }
    
    return res.status(200).json({
      message: 'Dados da empresa atualizados com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar dados da empresa:', error)
    return res.status(500).json({ error: 'Erro ao atualizar dados da empresa' })
  } finally {
    await connection.end()
  }
}

async function ensureTableExists(connection: mysql.Connection) {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS company_data (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      cnpj VARCHAR(18) NOT NULL,
      address TEXT NOT NULL,
      phone VARCHAR(20) NOT NULL,
      email VARCHAR(255) NOT NULL,
      website VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
  
  await connection.execute(createTableQuery)
}