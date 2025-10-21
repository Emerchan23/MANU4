import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Proteger apenas rotas de configuração
  if (request.nextUrl.pathname.startsWith('/configuracoes')) {
    // Verificar se há dados de usuário no localStorage (simulado via headers)
    const userDataHeader = request.headers.get('x-user-data')
    
    if (!userDataHeader) {
      // Redirecionar para login se não autenticado
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const userData = JSON.parse(userDataHeader)
      
      // Verificar se é admin
      if (!userData.isAdmin) {
        // Redirecionar para dashboard se não for admin
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      // Se não conseguir parsear os dados, redirecionar para login
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/configuracoes/:path*']
}