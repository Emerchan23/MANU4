import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Configuração do banco de dados MariaDB
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// GET - Listar empresas com busca e paginação
export async function GET(request: NextRequest) {
  let connection;
  try {
    console.log('🔄 API /api/companies - Iniciando busca de empresas...');
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    console.log('📊 Parâmetros:', { search, page, limit, offset });

    // Conectar ao MariaDB
    connection = await mysql.createConnection(dbConfig);

    // Verificar se a tabela companies existe, se não, criar
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        cnpj VARCHAR(18) UNIQUE,
        address TEXT,
        phone VARCHAR(20),
        email VARCHAR(255),
        contact_person VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        active BOOLEAN DEFAULT TRUE
      )
    `);

    console.log('✅ Tabela companies verificada/criada');

    // Query para buscar empresas
    let whereClause = 'WHERE 1=1';
    let queryParams: any[] = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR cnpj LIKE ? OR contact_person LIKE ?)';
      const searchTerm = `%${search}%`;
      queryParams = [searchTerm, searchTerm, searchTerm];
    }

    console.log('🔍 Query params:', queryParams);

    // Buscar empresas
    const [companies] = await connection.execute(
      `SELECT * FROM companies ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    console.log('📋 Empresas encontradas:', (companies as any[]).length);

    // Contar total de empresas
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM companies ${whereClause}`,
      queryParams
    ) as any;

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    console.log('📊 Total:', total, 'Páginas:', totalPages);

    const response = {
      success: true,
      companies,
      total,
      page,
      totalPages,
    };

    console.log('✅ Resposta enviada com sucesso');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Erro ao buscar empresas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor ao buscar empresas' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// POST - Criar nova empresa
export async function POST(request: NextRequest) {
  let connection;
  try {
    console.log('🔄 API /api/companies - Criando nova empresa...');
    
    // Get data from request body (proper REST API approach)
    const body = await request.json();
    console.log('📊 Dados recebidos via request body:', body);

    // Validação simples
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    // Conectar ao MariaDB
    connection = await mysql.createConnection(dbConfig);

    // Verificar se CNPJ já existe (se fornecido)
    if (body.cnpj) {
      const [existingCompany] = await connection.execute(
        'SELECT id FROM companies WHERE cnpj = ?',
        [body.cnpj]
      ) as any;

      if (existingCompany.length > 0) {
        return NextResponse.json(
          { success: false, message: 'CNPJ já cadastrado' },
          { status: 400 }
        );
      }
    }

    // Inserir nova empresa (sem specialties - campo não existe na tabela)
    const [result] = await connection.execute(
      `INSERT INTO companies (name, cnpj, contact_person, phone, email, address) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        body.name || '',
        body.cnpj || null,
        body.contact_person || null,
        body.phone || null,
        body.email || null,
        body.address || null
      ]
    ) as any;

    console.log('✅ Empresa criada com ID:', result.insertId);

    // Buscar empresa criada
    const [newCompany] = await connection.execute(
      'SELECT * FROM companies WHERE id = ?',
      [result.insertId]
    ) as any;

    return NextResponse.json({
      success: true,
      data: newCompany[0],
      id: result.insertId,
      message: 'Empresa criada com sucesso',
    });

  } catch (error: any) {
    console.error('❌ Erro ao criar empresa:', error);

    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor ao criar empresa' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}