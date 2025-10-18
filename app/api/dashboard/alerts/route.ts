import { NextRequest, NextResponse } from 'next/server'

// Endpoints de alertas do dashboard desativados: aba Alertas removida e tabelas dropadas
// Mantemos respostas seguras para evitar que o frontend que ainda
// consuma estes endpoints quebre.

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Funcionalidade de Alertas removida',
      data: {
        alerts: [],
        stats: {
          total: 0,
          active: 0,
          critical: 0,
          warning: 0,
          info: 0,
          last_24h: 0
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Funcionalidade de Alertas removida' },
    { status: 410 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, error: 'Funcionalidade de Alertas removida' },
    { status: 410 }
  )
}