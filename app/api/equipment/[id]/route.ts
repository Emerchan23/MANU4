import { NextRequest, NextResponse } from 'next/server';
const equipmentAPI = require('../../../../api/equipment');

// GET - Buscar equipamento por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mockReq = {
      params: { id: params.id },
      query: {},
      body: {}
    };

    let responseData: any = null;
    let statusCode = 200;

    const mockRes = {
      json: (data: any) => {
        responseData = data;
      },
      status: (code: number) => {
        statusCode = code;
        return {
          json: (data: any) => {
            responseData = data;
          }
        };
      }
    };

    await equipmentAPI.getEquipmentById(mockReq, mockRes);

    return NextResponse.json(responseData, { status: statusCode });
  } catch (error) {
    console.error('Erro ao buscar equipamento:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar equipamento
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const mockReq = {
      params: { id: params.id },
      body,
      query: {}
    };

    let responseData: any = null;
    let statusCode = 200;

    const mockRes = {
      json: (data: any) => {
        responseData = data;
      },
      status: (code: number) => {
        statusCode = code;
        return {
          json: (data: any) => {
            responseData = data;
          }
        };
      }
    };

    await equipmentAPI.updateEquipment(mockReq, mockRes);

    return NextResponse.json(responseData, { status: statusCode });
  } catch (error) {
    console.error('Erro ao atualizar equipamento:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar equipamento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mockReq = {
      params: { id: params.id },
      query: {},
      body: {}
    };

    let responseData: any = null;
    let statusCode = 200;

    const mockRes = {
      json: (data: any) => {
        responseData = data;
      },
      status: (code: number) => {
        statusCode = code;
        return {
          json: (data: any) => {
            responseData = data;
          }
        };
      }
    };

    await equipmentAPI.deleteEquipment(mockReq, mockRes);

    return NextResponse.json(responseData, { status: statusCode });
  } catch (error) {
    console.error('Erro ao deletar equipamento:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}