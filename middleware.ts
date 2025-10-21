import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Temporariamente desabilitado para debug do erro "Response body object should not be disturbed or locked"
  // Apenas permitir todas as requisições passarem sem modificação
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Matcher vazio para não interceptar nenhuma rota durante o debug
    '/debug-middleware-disabled'
  ]
}