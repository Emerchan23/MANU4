import { NextApiRequest, NextApiResponse } from 'next'
import mysql from 'mysql2/promise'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { promisify } from 'util'

const writeFile = promisify(fs.writeFile)
const unlink = promisify(fs.unlink)

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sis_manu',
  port: parseInt(process.env.DB_PORT || '3306'),
}

// Configuração do multer para upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Tipo de arquivo não suportado'))
    }
  },
})

// Middleware para processar upload
const uploadMiddleware = upload.single('logo')

function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result)
      }
      return resolve(result)
    })
  })
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res)
  } else if (req.method === 'POST') {
    return handlePost(req, res)
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res)
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

    // Buscar logo ativo
    const [rows] = await connection.execute(
      'SELECT * FROM company_logos WHERE is_active = 1 ORDER BY id DESC LIMIT 1'
    )

    if (Array.isArray(rows) && rows.length > 0) {
      const logo = rows[0]
      return res.status(200).json({
        success: true,
        logo
      })
    } else {
      return res.status(200).json({
        success: true,
        logo: null
      })
    }

  } catch (error) {
    console.error('Erro ao buscar logo:', error)
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
    // Processar upload
    await runMiddleware(req, res, uploadMiddleware)

    const file = (req as any).file
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      })
    }

    connection = await mysql.createConnection(dbConfig)

    // Verificar se a tabela existe, se não, criar
    await ensureTableExists(connection)

    // Desativar logos anteriores
    await connection.execute(
      'UPDATE company_logos SET is_active = 0 WHERE is_active = 1'
    )

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const extension = path.extname(file.originalname)
    const filename = `logo_${timestamp}${extension}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos')
    const filePath = path.join(uploadDir, filename)

    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Salvar arquivo
    await writeFile(filePath, file.buffer)

    // Salvar no banco de dados
    const [result] = await connection.execute(
      `INSERT INTO company_logos (
        original_name, 
        filename, 
        file_path, 
        file_size, 
        mime_type, 
        is_active,
        created_at
      ) VALUES (?, ?, ?, ?, ?, 1, NOW())`,
      [
        file.originalname,
        filename,
        `/uploads/logos/${filename}`,
        file.size,
        file.mimetype
      ]
    )

    const insertId = (result as any).insertId

    // Buscar logo inserido
    const [logoRows] = await connection.execute(
      'SELECT * FROM company_logos WHERE id = ?',
      [insertId]
    )

    const logo = Array.isArray(logoRows) && logoRows.length > 0 ? logoRows[0] : null

    return res.status(200).json({
      success: true,
      message: 'Logo enviado com sucesso',
      logo
    })

  } catch (error) {
    console.error('Erro ao fazer upload do logo:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    })
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  let connection

  try {
    const { id } = req.query

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID do logo não fornecido'
      })
    }

    connection = await mysql.createConnection(dbConfig)

    // Buscar logo para obter o caminho do arquivo
    const [logoRows] = await connection.execute(
      'SELECT * FROM company_logos WHERE id = ?',
      [id]
    )

    if (!Array.isArray(logoRows) || logoRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Logo não encontrado'
      })
    }

    const logo = logoRows[0] as any

    // Remover arquivo do sistema
    const filePath = path.join(process.cwd(), 'public', logo.file_path)
    if (fs.existsSync(filePath)) {
      await unlink(filePath)
    }

    // Remover do banco de dados
    await connection.execute(
      'DELETE FROM company_logos WHERE id = ?',
      [id]
    )

    return res.status(200).json({
      success: true,
      message: 'Logo removido com sucesso'
    })

  } catch (error) {
    console.error('Erro ao remover logo:', error)
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
    CREATE TABLE IF NOT EXISTS company_logos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      original_name VARCHAR(255) NOT NULL,
      filename VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size INT NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      is_active BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `

  await connection.execute(createTableQuery)
}