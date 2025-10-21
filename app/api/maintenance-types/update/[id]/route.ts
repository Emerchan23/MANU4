import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
}

// PUT /api/maintenance-types/update/[id] - Atualizar tipo de manutenção (rota alternativa)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection: mysql.Connection | null = null;
  
  try {
    console.log('🔄 [MAINTENANCE-TYPES UPDATE] Iniciando atualização via rota alternativa');
    console.log('📋 ID recebido:', params.id);
    
    // Parse do body da requisição
    const body = await request.json();
    console.log('📦 Body recebido:', body);
    
    const { name, isActive } = body;
    
    // Validação dos dados obrigatórios
    if (!name) {
      console.log('❌ Nome é obrigatório');
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    console.log('🔌 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    
    // Verificar se o tipo de manutenção existe na tabela correta
    console.log('🔍 Verificando se o tipo existe...');
    const [existingRows] = await connection.execute(
      'SELECT id FROM maintenance_types WHERE id = ?',
      [params.id]
    );
    
    if (!Array.isArray(existingRows) || existingRows.length === 0) {
      console.log('❌ Tipo de manutenção não encontrado');
      return NextResponse.json(
        { error: 'Tipo de manutenção não encontrado' },
        { status: 404 }
      );
    }
    
    // Atualizar o tipo de manutenção na tabela correta
    console.log('💾 Executando atualização...');
    const [updateResult] = await connection.execute(
      `UPDATE maintenance_types 
       SET name = ?, isActive = ?, updated_at = NOW() 
       WHERE id = ?`,
      [name, isActive ? 1 : 0, params.id]
    );
    
    console.log('✅ Atualização executada:', updateResult);
    
    // Buscar o registro atualizado
    console.log('🔍 Buscando registro atualizado...');
    const [updatedRows] = await connection.execute(
      'SELECT id, name, isActive, created_at as createdAt, updated_at as updatedAt FROM maintenance_types WHERE id = ?',
      [params.id]
    );
    
    if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
      console.log('❌ Erro ao buscar registro atualizado');
      return NextResponse.json(
        { error: 'Erro ao buscar registro atualizado' },
        { status: 500 }
      );
    }
    
    const updatedType = updatedRows[0] as any;
    console.log('✅ Registro atualizado:', updatedType);
    
    return NextResponse.json({
      id: updatedType.id,
      name: updatedType.name,
      isActive: Boolean(updatedType.isActive),
      createdAt: updatedType.createdAt,
      updatedAt: updatedType.updatedAt
    });
    
  } catch (error) {
    console.error('❌ [MAINTENANCE-TYPES UPDATE] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      console.log('🔌 Fechando conexão com o banco');
      await connection.end();
    }
  }
}