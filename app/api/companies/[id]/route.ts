import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { UpdateCompanySchema } from '@/types/company';

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  port: parseInt(process.env.DB_PORT || '3306'),
};

// GET - Buscar empresa por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'ID inválido' },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection(dbConfig);

    const [companies] = await connection.execute(
      'SELECT * FROM companies WHERE id = ?',
      [id]
    ) as any;

    await connection.end();

    if (companies.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      company: companies[0],
    });

  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar empresa
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'ID inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validar dados com Zod
    const validatedData = UpdateCompanySchema.parse({ ...body, id });

    const connection = await mysql.createConnection(dbConfig);

    // Verificar se empresa existe
    const [existingCompany] = await connection.execute(
      'SELECT id FROM companies WHERE id = ?',
      [id]
    ) as any;

    if (existingCompany.length === 0) {
      await connection.end();
      return NextResponse.json(
        { success: false, message: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se CNPJ já existe em outra empresa
    const [cnpjCheck] = await connection.execute(
      'SELECT id FROM companies WHERE cnpj = ? AND id != ?',
      [validatedData.cnpj, id]
    ) as any;

    if (cnpjCheck.length > 0) {
      await connection.end();
      return NextResponse.json(
        { success: false, message: 'CNPJ já cadastrado em outra empresa' },
        { status: 400 }
      );
    }

    // Atualizar empresa
    await connection.execute(
      `UPDATE companies SET 
       name = ?, cnpj = ?, contact_person = ?, phone = ?, 
       email = ?, address = ?, specialties = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        validatedData.name,
        validatedData.cnpj,
        validatedData.contact_person,
        validatedData.phone,
        validatedData.email,
        validatedData.address,
        validatedData.specialties,
        id,
      ]
    );

    // Buscar empresa atualizada
    const [updatedCompany] = await connection.execute(
      'SELECT * FROM companies WHERE id = ?',
      [id]
    ) as any;

    await connection.end();

    return NextResponse.json({
      success: true,
      company: updatedCompany[0],
      message: 'Empresa atualizada com sucesso',
    });

  } catch (error: any) {
    console.error('Erro ao atualizar empresa:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Dados inválidos', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir empresa
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'ID inválido' },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection(dbConfig);

    // Verificar se empresa existe
    const [existingCompany] = await connection.execute(
      'SELECT id, name FROM companies WHERE id = ?',
      [id]
    ) as any;

    if (existingCompany.length === 0) {
      await connection.end();
      return NextResponse.json(
        { success: false, message: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    // Excluir empresa
    await connection.execute(
      'DELETE FROM companies WHERE id = ?',
      [id]
    );

    await connection.end();

    return NextResponse.json({
      success: true,
      message: `Empresa "${existingCompany[0].name}" excluída com sucesso`,
    });

  } catch (error) {
    console.error('Erro ao excluir empresa:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}