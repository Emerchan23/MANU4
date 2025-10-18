import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Obter token do cookie
    const authToken = request.cookies.get('auth_token')?.value
    
    if (!authToken) {
      return NextResponse.json(
        { success: false, error: "Token de autenticação não encontrado" },
        { status: 401 }
      )
    }

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