import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Remover cookie de autenticação (sistema simplificado)
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logout realizado com sucesso' 
    });
    
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0)
    });
    
    // Remover cookie do cookieStore também
    cookieStore.delete('auth_token');
    
    return response;

  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json(
      { error: 'Erro ao realizar logout' },
      { status: 500 }
    );
  }
}
