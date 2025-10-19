import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { UpdateCompanySchema } from '@/types/company';

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00'
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
  let connection: mysql.Connection | null = null;

  try {
    console.log('🔄 PUT /api/companies/[id] - Iniciando...');
    
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'ID inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = UpdateCompanySchema.parse(body);

    // Conectar ao banco
    connection = await mysql.createConnection(dbConfig);

    // Verificar se empresa existe
    const [existingRows] = await connection.execute(
      'SELECT id FROM companies WHERE id = ?',
      [id]
    );

    const existingCompanies = existingRows as any[];
    if (existingCompanies.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    // Verificar CNPJ duplicado (se fornecido)
    if (validatedData.cnpj) {
      const [cnpjRows] = await connection.execute(
        'SELECT id FROM companies WHERE cnpj = ? AND id != ?',
        [validatedData.cnpj, id]
      );

      const cnpjCompanies = cnpjRows as any[];
      if (cnpjCompanies.length > 0) {
        return NextResponse.json(
          { success: false, message: 'CNPJ já está em uso por outra empresa' },
          { status: 400 }
        );
      }
    }

    // Atualizar empresa
    await connection.execute(
      `UPDATE companies SET 
        name = ?, 
        cnpj = ?, 
        address = ?, 
        phone = ?, 
        email = ?, 
        contact_person = ?, 
        updated_at = NOW() 
      WHERE id = ?`,
      [
        validatedData.name,
        validatedData.cnpj,
        validatedData.address,
        validatedData.phone,
        validatedData.email,
        validatedData.contact_person,
        id
      ]
    );

    // Buscar empresa atualizada
    const [updatedRows] = await connection.execute(
      'SELECT * FROM companies WHERE id = ?',
      [id]
    );

    const updatedCompanies = updatedRows as any[];

    return NextResponse.json({
      success: true,
      message: 'Empresa atualizada com sucesso',
      company: updatedCompanies[0]
    });

  } catch (error: any) {
    console.error('❌ Erro no PUT:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Dados inválidos', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor', error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
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