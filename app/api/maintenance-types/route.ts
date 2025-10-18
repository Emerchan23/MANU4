import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Configuração do banco de dados MariaDB
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
  timezone: '+00:00'
}

export async function GET(request: NextRequest) {
  let connection;
  try {
    console.log('🔍 API maintenance-types - GET request received');
    connection = await mysql.createConnection(dbConfig)
    
    // Primeiro, verificar se a tabela tipos_manutencao existe e tem dados válidos
    const [tableCheck] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tipos_manutencao'
    `, [dbConfig.database]);
    
    if (tableCheck[0].count === 0) {
      console.log('❌ Tabela tipos_manutencao não existe, criando...');
      
      // Criar tabela
      await connection.execute(`
        CREATE TABLE tipos_manutencao (
          id INT(11) NOT NULL AUTO_INCREMENT,
          nome VARCHAR(100) NOT NULL,
          descricao TEXT NULL,
          categoria VARCHAR(50) NOT NULL DEFAULT 'preventiva',
          ativo BOOLEAN NOT NULL DEFAULT TRUE,
          criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
          atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uk_tipos_manutencao_nome (nome)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      // Inserir dados básicos
      await connection.execute(`
        INSERT INTO tipos_manutencao (nome, descricao, categoria) VALUES 
        ('Preventiva', 'Manutenção preventiva programada', 'preventiva'),
        ('Corretiva', 'Manutenção corretiva para reparo', 'corretiva'),
        ('Preditiva', 'Manutenção baseada em condição', 'preditiva'),
        ('Calibração', 'Calibração de equipamentos', 'calibracao'),
        ('Instalação', 'Instalação de novos equipamentos', 'instalacao'),
        ('Desinstalação', 'Remoção de equipamentos', 'desinstalacao'),
        ('Consultoria', 'Serviços de consultoria técnica', 'consultoria')
      `);
      
      console.log('✅ Tabela tipos_manutencao criada e populada');
    }
    
    // Verificar se existem dados válidos
    const [dataCheck] = await connection.execute(
      'SELECT COUNT(*) as count FROM tipos_manutencao WHERE ativo = 1 AND nome IS NOT NULL AND nome != ""'
    );
    
    if (dataCheck[0].count === 0) {
      console.log('❌ Não há dados válidos, inserindo dados padrão...');
      
      // Limpar dados inválidos
      await connection.execute('DELETE FROM tipos_manutencao WHERE nome IS NULL OR nome = "" OR nome IN ("4444", "treretetretre")');
      
      // Inserir dados válidos
      await connection.execute(`
        INSERT IGNORE INTO tipos_manutencao (nome, descricao, categoria) VALUES 
        ('Preventiva', 'Manutenção preventiva programada', 'preventiva'),
        ('Corretiva', 'Manutenção corretiva para reparo', 'corretiva'),
        ('Preditiva', 'Manutenção baseada em condição', 'preditiva'),
        ('Calibração', 'Calibração de equipamentos', 'calibracao'),
        ('Instalação', 'Instalação de novos equipamentos', 'instalacao'),
        ('Desinstalação', 'Remoção de equipamentos', 'desinstalacao'),
        ('Consultoria', 'Serviços de consultoria técnica', 'consultoria')
      `);
      
      console.log('✅ Dados válidos inseridos');
    }
    
    // Buscar tipos com filtro opcional de status
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status') || 'active'; // 'active', 'inactive', 'all'
    
    let whereClause = 'WHERE nome IS NOT NULL AND nome != ""';
    if (statusFilter === 'active') {
      whereClause += ' AND ativo = 1';
    } else if (statusFilter === 'inactive') {
      whereClause += ' AND ativo = 0';
    }
    // Para 'all', não adiciona filtro de ativo
    
    const [rows] = await connection.execute(`
      SELECT 
        id, 
        nome as name, 
        COALESCE(descricao, '') as description, 
        COALESCE(categoria, 'preventiva') as category, 
        ativo as isActive, 
        criado_em as createdAt, 
        atualizado_em as updatedAt 
      FROM tipos_manutencao 
      ${whereClause}
      ORDER BY nome ASC
    `);
    
    console.log('🔍 API maintenance-types - Rows found:', rows);
    
    // Retornar no formato esperado pelo formulário
    const response = {
      success: true,
      data: rows
    };
    
    console.log('🔍 API maintenance-types - Response:', response);
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ API maintenance-types - Erro ao buscar tipos de manutenção:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor: ' + error.message
      },
      { status: 500 }
    )
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export async function POST(request: NextRequest) {
  let connection;
  try {
    console.log('🔄 API /api/maintenance-types - POST request received');
    const body = await request.json();
    console.log('📊 Request body:', body);
    
    const { name, description, category = 'preventiva', isActive = true } = body;
    console.log('📊 Parsed data:', { name, description, category, isActive });
    
    // Validação simples
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }
    
    connection = await mysql.createConnection(dbConfig)
    console.log('✅ Database connection established');
    
    // Inserir novo tipo de manutenção
    const [result] = await connection.execute(
      'INSERT INTO tipos_manutencao (nome, descricao, categoria, ativo) VALUES (?, ?, ?, ?)',
      [name, description || null, category, isActive]
    );
    console.log('✅ INSERT query executed:', result);
    
    const insertId = (result as any).insertId;
    
    return NextResponse.json(
      { 
        success: true,
        data: {
          id: insertId,
          name,
          description,
          category,
          isActive
        },
        message: 'Tipo de manutenção criado com sucesso'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Erro ao criar tipo de manutenção:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor ao criar tipo de manutenção' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, isActive } = body;
    
    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID e nome são obrigatórios' },
        { status: 400 }
      )
    }
    
    const connection = await mysql.createConnection(dbConfig)
    
    // Verificar se o tipo existe
    const [existing] = await connection.execute(
      'SELECT id FROM tipos_manutencao WHERE id = ?',
      [id]
    )
    
    if (!Array.isArray(existing) || existing.length === 0) {
      await connection.end()
      return NextResponse.json(
        { error: 'Tipo de manutenção não encontrado' },
        { status: 404 }
      )
    }
    
    // Atualizar tipo de manutenção (apenas nome e ativo)
    await connection.execute(
      'UPDATE tipos_manutencao SET nome = ?, ativo = ?, atualizado_em = NOW() WHERE id = ?',
      [name, isActive, id]
    );
    
    await connection.end()
    
    return NextResponse.json({
      id,
      name,
      isActive,
      message: 'Tipo de manutenção atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar tipo de manutenção:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      )
    }
    
    const connection = await mysql.createConnection(dbConfig)
    
    // Verificar se o tipo existe
    const [existing] = await connection.execute(
      'SELECT id FROM tipos_manutencao WHERE id = ?',
      [id]
    )
    
    if (!Array.isArray(existing) || existing.length === 0) {
      await connection.end()
      return NextResponse.json(
        { error: 'Tipo de manutenção não encontrado' },
        { status: 404 }
      )
    }
    
    // Deletar tipo de manutenção
    await connection.execute(
      'DELETE FROM tipos_manutencao WHERE id = ?',
      [id]
    )
    
    await connection.end()
    
    return NextResponse.json({
      message: 'Tipo de manutenção excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir tipo de manutenção:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}