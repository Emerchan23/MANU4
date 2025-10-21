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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection;
  try {
    const { id } = params;
    console.log('🔄 POST /api/companies/update/[id] - Atualizando empresa:', id);

    // Ler o body da requisição
    const body = await request.json();
    console.log('📊 Body recebido:', body);

    // Validação básica
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    // Conectar ao banco
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');

    // Verificar se a empresa existe
    const [existingCompany] = await connection.execute(
      'SELECT id FROM companies WHERE id = ?',
      [id]
    );
    
    if (!Array.isArray(existingCompany) || existingCompany.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    // Construir query de atualização dinamicamente
    const updates = [];
    const params = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      params.push(body.name);
    }
    if (body.cnpj !== undefined) {
      updates.push('cnpj = ?');
      params.push(body.cnpj);
    }
    if (body.address !== undefined) {
      updates.push('address = ?');
      params.push(body.address);
    }
    if (body.phone !== undefined) {
      updates.push('phone = ?');
      params.push(body.phone);
    }
    if (body.email !== undefined) {
      updates.push('email = ?');
      params.push(body.email);
    }
    if (body.contact_person !== undefined) {
      updates.push('contact_person = ?');
      params.push(body.contact_person);
    }
    if (body.active !== undefined) {
      updates.push('active = ?');
      params.push(body.active);
    }
    if (body.specialties !== undefined) {
      updates.push('specialties = ?');
      params.push(body.specialties);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    // Adicionar updated_at e o ID no final
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const updateQuery = `UPDATE companies SET ${updates.join(', ')} WHERE id = ?`;
    console.log('📊 Query de atualização:', updateQuery);
    console.log('📊 Parâmetros:', params);

    const [updateResult] = await connection.execute(updateQuery, params);
    console.log('✅ Resultado da atualização:', updateResult);

    if ((updateResult as any).affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhuma linha foi atualizada' },
        { status: 400 }
      );
    }

    // Buscar a empresa atualizada
    const [updatedCompany] = await connection.execute(
      'SELECT * FROM companies WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      data: (updatedCompany as any[])[0],
      message: 'Empresa atualizada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar empresa:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}