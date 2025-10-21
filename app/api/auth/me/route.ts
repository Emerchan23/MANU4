import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Sistema de autenticação simplificado removido
    return NextResponse.json(
      { error: 'Endpoint desabilitado - sistema de autenticação simplificado' },
      { status: 501 }
    );

    // Verificar e decodificar o token
    const decoded = await verifyToken(authToken)
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: "Token inválido" },
        { status: 401 }
      )
    }

    // Retornar informações do usuário
    return NextResponse.json({
      success: true,
      user: {
        id: decoded.userId,
        email: decoded.email || null,
        name: decoded.name || null
      }
    })

  } catch (error) {
    console.error("Erro ao obter usuário atual:", error)
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}