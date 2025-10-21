// Sistema de Rate Limiting para prevenir sobrecarga do banco de dados
class RateLimiter {
  constructor() {
    this.requests = new Map() // endpoint -> array de timestamps
    this.limits = {
      // Limites aumentados para permitir mais requisições dos dashboards
      '/api/dashboard/metrics': 30,
      '/api/dashboard/alerts': 40,
      '/api/dashboard/calendar': 25,
      '/api/maintenance-dashboard': 35,
      '/api/service-orders': 50,
      '/api/equipment': 60,
      // Limite padrão aumentado para outros endpoints
      default: 100
    }
    this.windowMs = 60000 // 1 minuto em millisegundos
    this.cleanupInterval = 300000 // Limpeza a cada 5 minutos
    
    // Iniciar limpeza automática
    setInterval(() => this.cleanup(), this.cleanupInterval)
  }

  // Verificar se a requisição está dentro do limite
  isAllowed(endpoint, clientId = 'default') {
    const key = `${endpoint}:${clientId}`
    const now = Date.now()
    const limit = this.limits[endpoint] || this.limits.default
    
    // Obter histórico de requisições para este endpoint/cliente
    if (!this.requests.has(key)) {
      this.requests.set(key, [])
    }
    
    const requestHistory = this.requests.get(key)
    
    // Remover requisições antigas (fora da janela de tempo)
    const validRequests = requestHistory.filter(timestamp => 
      now - timestamp < this.windowMs
    )
    
    // Verificar se está dentro do limite
    if (validRequests.length >= limit) {
      console.log(`🚫 Rate limit excedido para ${endpoint} (${validRequests.length}/${limit})`)
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.min(...validRequests) + this.windowMs,
        retryAfter: Math.ceil((Math.min(...validRequests) + this.windowMs - now) / 1000)
      }
    }
    
    // Adicionar a requisição atual
    validRequests.push(now)
    this.requests.set(key, validRequests)
    
    console.log(`✅ Rate limit OK para ${endpoint} (${validRequests.length}/${limit})`)
    
    return {
      allowed: true,
      remaining: limit - validRequests.length,
      resetTime: now + this.windowMs,
      retryAfter: 0
    }
  }

  // Middleware para Next.js
  middleware(endpoint) {
    return (request, response, next) => {
      // Identificar cliente (IP ou user ID)
      const clientId = request.headers['x-forwarded-for'] || 
                      request.connection?.remoteAddress || 
                      request.ip || 
                      'unknown'
      
      const result = this.isAllowed(endpoint, clientId)
      
      // Adicionar headers de rate limiting
      response.setHeader('X-RateLimit-Limit', this.limits[endpoint] || this.limits.default)
      response.setHeader('X-RateLimit-Remaining', result.remaining)
      response.setHeader('X-RateLimit-Reset', result.resetTime)
      
      if (!result.allowed) {
        response.setHeader('Retry-After', result.retryAfter)
        return response.status(429).json({
          error: 'Rate limit exceeded',
          message: `Muitas requisições para ${endpoint}. Tente novamente em ${result.retryAfter} segundos.`,
          retryAfter: result.retryAfter
        })
      }
      
      if (next) {
        return next()
      }
    }
  }

  // Middleware para API Routes do Next.js
  apiMiddleware(endpoint) {
    return (request, response) => {
      const clientId = request.headers['x-forwarded-for'] || 
                      request.socket?.remoteAddress || 
                      'unknown'
      
      const result = this.isAllowed(endpoint, clientId)
      
      // Adicionar headers de rate limiting
      response.setHeader('X-RateLimit-Limit', this.limits[endpoint] || this.limits.default)
      response.setHeader('X-RateLimit-Remaining', result.remaining)
      response.setHeader('X-RateLimit-Reset', result.resetTime)
      
      if (!result.allowed) {
        response.setHeader('Retry-After', result.retryAfter)
        response.status(429).json({
          error: 'Rate limit exceeded',
          message: `Muitas requisições para ${endpoint}. Tente novamente em ${result.retryAfter} segundos.`,
          retryAfter: result.retryAfter
        })
        return false // Indica que a requisição foi bloqueada
      }
      
      return true // Indica que a requisição pode prosseguir
    }
  }

  // Limpeza de dados antigos
  cleanup() {
    const now = Date.now()
    let cleaned = 0
    
    for (const [key, timestamps] of this.requests.entries()) {
      const validRequests = timestamps.filter(timestamp => 
        now - timestamp < this.windowMs
      )
      
      if (validRequests.length === 0) {
        this.requests.delete(key)
        cleaned++
      } else {
        this.requests.set(key, validRequests)
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Rate limiter: ${cleaned} entradas antigas removidas`)
    }
  }

  // Obter estatísticas
  getStats() {
    const stats = {
      totalEndpoints: this.requests.size,
      limits: this.limits,
      windowMs: this.windowMs,
      activeRequests: 0
    }
    
    const now = Date.now()
    for (const timestamps of this.requests.values()) {
      stats.activeRequests += timestamps.filter(t => now - t < this.windowMs).length
    }
    
    return stats
  }

  // Configurar limite personalizado
  setLimit(endpoint, limit) {
    this.limits[endpoint] = limit
    console.log(`📊 Rate limit atualizado para ${endpoint}: ${limit} req/min`)
  }

  // Resetar histórico de um endpoint/cliente
  reset(endpoint, clientId = null) {
    if (clientId) {
      const key = `${endpoint}:${clientId}`
      this.requests.delete(key)
    } else {
      // Resetar todos os clientes deste endpoint
      for (const key of this.requests.keys()) {
        if (key.startsWith(`${endpoint}:`)) {
          this.requests.delete(key)
        }
      }
    }
    console.log(`🔄 Rate limit resetado para ${endpoint}${clientId ? `:${clientId}` : ''}`)
  }
}

// Instância singleton
const rateLimiter = new RateLimiter()

export default rateLimiter
export { RateLimiter }