import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Proteger rota de configurações apenas para admin
  if (pathname.startsWith('/configuracoes')) {
    console.log('🔍 Middleware - Verificando acesso à rota:', pathname);
    
    // Verificar se o usuário está autenticado e é admin
    const userCookie = request.cookies.get('user')
    console.log('🍪 Middleware - Cookie encontrado:', userCookie ? 'SIM' : 'NÃO');
    
    if (!userCookie) {
      console.log('❌ Middleware - Cookie não encontrado, redirecionando para login');
      // Redirecionar para login se não autenticado
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const user = JSON.parse(userCookie.value)
      console.log('👤 Middleware - Dados do usuário:', {
        name: user.name || user.username,
        role: user.role,
        isAdmin: user.isAdmin
      });
      
      // Verificar se é admin
      if (!user.isAdmin && user.role !== 'ADMIN') {
        console.log('❌ Middleware - Usuário não é admin, redirecionando para dashboard');
        // Redirecionar para dashboard se não for admin
        return NextResponse.redirect(new URL('/', request.url))
      }
      
      console.log('✅ Middleware - Acesso autorizado para admin');
    } catch (error) {
      console.error('❌ Middleware - Erro ao parsear cookie:', error);
      // Se erro ao parsear cookie, redirecionar para login
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/configuracoes/:path*'
  ]
}