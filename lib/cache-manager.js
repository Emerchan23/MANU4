/**
 * Sistema de Cache para reduzir carga no banco de dados
 * Implementa cache em memória com TTL e invalidação inteligente
 */

class CacheManager {
  constructor() {
    this.cache = new Map()
    this.ttlMap = new Map()
    this.hitCount = 0
    this.missCount = 0
    
    // Configurações padrão
    this.defaultTTL = 5 * 60 * 1000 // 5 minutos
    this.maxCacheSize = 1000 // Máximo de entradas
    
    // Limpeza automática a cada minuto
    setInterval(() => this.cleanup(), 60000)
    
    console.log('💾 [CACHE] Sistema de cache inicializado')
  }
  
  /**
   * Gera chave de cache baseada em parâmetros
   */
  generateKey(prefix, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    
    return `${prefix}:${sortedParams}`
  }
  
  /**
   * Obtém valor do cache
   */
  get(key) {
    // Verificar se existe e não expirou
    if (this.cache.has(key)) {
      const ttl = this.ttlMap.get(key)
      
      if (ttl && Date.now() > ttl) {
        // Expirado, remover
        this.cache.delete(key)
        this.ttlMap.delete(key)
        this.missCount++
        return null
      }
      
      this.hitCount++
      return this.cache.get(key)
    }
    
    this.missCount++
    return null
  }
  
  /**
   * Define valor no cache
   */
  set(key, value, ttl = this.defaultTTL) {
    // Verificar limite de tamanho
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldest()
    }
    
    this.cache.set(key, value)
    this.ttlMap.set(key, Date.now() + ttl)
    
    return true
  }
  
  /**
   * Remove entrada específica
   */
  delete(key) {
    this.cache.delete(key)
    this.ttlMap.delete(key)
  }
  
  /**
   * Limpa cache por padrão
   */
  invalidatePattern(pattern) {
    let count = 0
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
        this.ttlMap.delete(key)
        count++
      }
    }
    
    console.log(`🗑️ [CACHE] Invalidadas ${count} entradas com padrão: ${pattern}`)
    return count
  }
  
  /**
   * Wrapper para cache de queries de dashboard
   */
  async cacheQuery(key, queryFunction, ttl = this.defaultTTL) {
    // Tentar obter do cache primeiro
    const cached = this.get(key)
    if (cached !== null) {
      console.log(`✅ [CACHE] Hit para: ${key}`)
      return cached
    }
    
    try {
      // Executar query e cachear resultado
      console.log(`🔄 [CACHE] Miss para: ${key} - executando query`)
      const result = await queryFunction()
      
      // Verificar se o resultado não é vazio ou null antes de cachear
      if (result !== null && result !== undefined) {
        this.set(key, result, ttl)
        return result
      } else {
        // Se resultado for vazio, não cachear e retornar dados padrão
        console.warn(`⚠️ [CACHE] Resultado vazio para ${key} - não cacheando`)
        return this.getDefaultData(key)
      }
      
    } catch (error) {
      console.error(`❌ [CACHE] Erro na query para ${key}:`, error.message)
      // Em caso de erro, retornar dados padrão em vez de falhar
      return this.getDefaultData(key)
    }
  }
  
  /**
   * Retorna dados padrão quando cache falha ou está vazio
   */
  getDefaultData(key) {
    if (key.includes('dashboard:metrics')) {
      return {
        pendingSchedules: 0,
        overdueSchedules: 0,
        completedThisMonth: 0,
        completionRate: 0,
        upcomingSchedules: [],
        overdueSchedules: [],
        monthlyStats: [],
        costAnalysis: { totalCost: 0, averageCost: 0 }
      }
    }
    
    if (key.includes('dashboard:alerts')) {
      return []
    }
    
    // Retorno padrão genérico
    return null
  }
  
  /**
   * Cache específico para métricas de dashboard
   */
  async getDashboardMetrics(queryFunction) {
    const key = this.generateKey('dashboard:metrics')
    return this.cacheQuery(key, queryFunction, 2 * 60 * 1000) // 2 minutos
  }
  
  /**
   * Cache para alertas
   */
  async getDashboardAlerts(queryFunction) {
    const key = this.generateKey('dashboard:alerts')
    return this.cacheQuery(key, queryFunction, 1 * 60 * 1000) // 1 minuto
  }
  
  /**
   * Cache para dados de manutenção
   */
  async getMaintenanceData(filters, queryFunction) {
    const key = this.generateKey('maintenance:data', filters)
    return this.cacheQuery(key, queryFunction, 3 * 60 * 1000) // 3 minutos
  }
  
  /**
   * Cache para equipamentos
   */
  async getEquipmentData(filters, queryFunction) {
    const key = this.generateKey('equipment:data', filters)
    return this.cacheQuery(key, queryFunction, 5 * 60 * 1000) // 5 minutos
  }
  
  /**
   * Remove entradas expiradas
   */
  cleanup() {
    const now = Date.now()
    let cleaned = 0
    
    for (const [key, ttl] of this.ttlMap.entries()) {
      if (now > ttl) {
        this.cache.delete(key)
        this.ttlMap.delete(key)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 [CACHE] Limpeza automática: ${cleaned} entradas removidas`)
    }
  }
  
  /**
   * Remove entrada mais antiga quando cache está cheio
   */
  evictOldest() {
    let oldestKey = null
    let oldestTime = Infinity
    
    for (const [key, ttl] of this.ttlMap.entries()) {
      if (ttl < oldestTime) {
        oldestTime = ttl
        oldestKey = key
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.ttlMap.delete(oldestKey)
      console.log(`🗑️ [CACHE] Entrada mais antiga removida: ${oldestKey}`)
    }
  }
  
  /**
   * Estatísticas do cache
   */
  getStats() {
    const total = this.hitCount + this.missCount
    const hitRate = total > 0 ? (this.hitCount / total * 100).toFixed(2) : 0
    
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: `${hitRate}%`,
      memoryUsage: this.getMemoryUsage()
    }
  }
  
  /**
   * Estimativa de uso de memória
   */
  getMemoryUsage() {
    let totalSize = 0
    
    for (const [key, value] of this.cache.entries()) {
      totalSize += JSON.stringify(key).length
      totalSize += JSON.stringify(value).length
    }
    
    return {
      bytes: totalSize,
      kb: (totalSize / 1024).toFixed(2),
      mb: (totalSize / 1024 / 1024).toFixed(2)
    }
  }
  
  /**
   * Limpa todo o cache
   */
  clear() {
    const size = this.cache.size
    this.cache.clear()
    this.ttlMap.clear()
    this.hitCount = 0
    this.missCount = 0
    
    console.log(`🗑️ [CACHE] Cache limpo: ${size} entradas removidas`)
  }
  
  /**
   * Middleware para invalidação automática baseada em rotas
   */
  getInvalidationMiddleware() {
    return (req, res, next) => {
      const originalSend = res.send
      
      res.send = function(data) {
        // Invalidar cache baseado no método e rota
        if (req.method !== 'GET') {
          const path = req.path || req.url
          
          if (path.includes('/equipment')) {
            cacheManager.invalidatePattern('equipment:')
          }
          if (path.includes('/maintenance')) {
            cacheManager.invalidatePattern('maintenance:')
          }
          if (path.includes('/dashboard')) {
            cacheManager.invalidatePattern('dashboard:')
          }
        }
        
        return originalSend.call(this, data)
      }
      
      next()
    }
  }
}

// Instância singleton
const cacheManager = new CacheManager()

export default cacheManager