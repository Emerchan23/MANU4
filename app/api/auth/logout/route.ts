import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { destroySession, logAccess, getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (token) {
      // Buscar usuário antes de destruir sessão
      const user = await getCurrentUser(request);

      // Destruir sessão no banco
      await destroySession(token);

      // Log de logout
      if (user) {
        await logAccess(
          user.id,
          'logout',
          'auth',
          request.ip,
          request.headers.get('user-agent') || undefined
        );
      }

      // Remover cookie
      cookieStore.delete('auth_token');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json(
      { error: 'Erro ao realizar logout' },
      { status: 500 }
    );
  }
}
