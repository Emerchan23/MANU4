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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  try {
    console.log('🔄 PUT /api/maintenance-types/[id] - Request received for ID:', params.id);
    const body = await request.json();
    console.log('📊 Request body:', body);
    
    const { name, isActive } = body;
    const id = params.id;
    
    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID e nome são obrigatórios' },
        { status: 400 }
      )
    }
    
    connection = await mysql.createConnection(dbConfig)
    console.log('✅ Database connection established');
    
    // Verificar se o tipo existe na tabela correta
    const [existing] = await connection.execute(
      'SELECT id FROM maintenance_types WHERE id = ?',
      [id]
    )
    console.log('🔍 Existing record check:', existing);
    
    if (!Array.isArray(existing) || existing.length === 0) {
      return NextResponse.json(
        { error: 'Tipo de manutenção não encontrado' },
        { status: 404 }
      )
    }
    
    // Atualizar tipo de manutenção (apenas nome e ativo) - usando isActive para compatibilidade MariaDB
    const [updateResult] = await connection.execute(
      'UPDATE maintenance_types SET name = ?, isActive = ?, updated_at = NOW() WHERE id = ?',
      [name, isActive ? 1 : 0, id]
    );
    console.log('✅ Update result:', updateResult);
    
    // Buscar o registro atualizado para retornar
    const [updated] = await connection.execute(
      'SELECT id, name, isActive FROM maintenance_types WHERE id = ?',
      [id]
    );
    
    const updatedRecord = (updated as any[])[0];
    
    return NextResponse.json({
      id: updatedRecord.id,
      name: updatedRecord.name,
      isActive: updatedRecord.isActive,
      message: 'Tipo de manutenção atualizado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar tipo de manutenção:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}