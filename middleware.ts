import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-edge';

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/pdf/generate',
  '/api/pdf/download',
  '/api/pdf/new-download',
  '/api/pdf/logo',
  '/api/pdf/test-simple',
  '/api/pdf/test-debug',
  '/api/pdf/test-rect',
  '/api/notifications/count',
  '/api/notifications',
  '/api/equipment/stats',
  '/api/service-orders/stats',
  '/api/service-orders',
  '/api/dashboard/stats',
  '/api/dashboard/heatmap',
  '/api/dashboard/status',
  '/api/maintenance-dashboard',
  '/api/maintenance-types',
  '/api/sectors',
  '/api/subsectors',
  '/api/service-templates',
  '/api/template-categories',
  '/api/companies',
  '/api/maintenance-schedules',
  '/api/validation/summary',
  '/api/validation/entities-summary',
  '/login',
  '/_next',
  '/favicon.ico',
  '/static'
];

// Rotas específicas que devem ser tratadas exatamente
const EXACT_ROUTES = [
  '/api/service-orders/stats',
  '/api/equipment/stats'
];

// Rotas da API que precisam de autenticação
const PROTECTED_API_ROUTES = [
  '/api/equipments',
  // Removido: '/api/service-orders',
  '/api/preventive',
  '/api/corrective',
  '/api/predictive',
  // Removido: '/api/companies',
  '/api/users'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log(`🔍 Middleware executando para: ${pathname}`);

  // Permitir rotas públicas
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    console.log(`✅ Rota pública permitida: ${pathname}`);
    return NextResponse.next();
  }

  // Verificar autenticação
  const token = request.cookies.get('auth_token')?.value;
  console.log(`🍪 Token encontrado: ${token ? 'SIM' : 'NÃO'}`);

  // Se não tem token e está tentando acessar rota protegida
  if (!token) {
    console.log(`❌ Sem token, redirecionando para login`);
    // Se for API, retornar 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Se for página, redirecionar para login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar se token é válido
  try {
    console.log(`🔐 Verificando token...`);
    const payload = await verifyToken(token);
    
    if (!payload) {
      console.log(`❌ Token inválido`);
      throw new Error('Token inválido');
    }

    console.log(`✅ Token válido para usuário: ${payload.userId}`);

    // Token válido, permitir acesso (não verificamos sessão no banco no middleware para evitar problemas com edge runtime)
    console.log(`✅ Acesso permitido para: ${pathname}`);
    return NextResponse.next();

  } catch (error) {
    console.log(`❌ Erro na verificação: ${error.message}`);
    // Token inválido ou expirado
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Sessão expirada' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url));

    // Remover cookie inválido
    response.cookies.delete('auth_token');
    
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
