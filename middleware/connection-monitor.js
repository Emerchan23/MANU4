// Middleware para monitoramento de conexões do banco de dados
import { query } from '@/lib/database.js'

class ConnectionMonitor {
  constructor() {
    this.activeConnections = new Map()
    this.connectionStats = {
      total: 0,
      active: 0,
      peak: 0,
      errors: 0,
      lastReset: new Date()
    }
    this.alerts = []
    this.maxConnections = 100 // Limite padrão do MariaDB
    this.warningThreshold = 0.8 // 80% do limite
    this.criticalThreshold = 0.9 // 90% do limite
  }

  // Registrar nova conexão
  registerConnection(endpoint, userId = null) {
    const connectionId = `${Date.now()}-${Math.random()}`
    const connection = {
      id: connectionId,
      endpoint,
      userId,
      startTime: new Date(),
      status: 'active'
    }
    
    this.activeConnections.set(connectionId, connection)
    this.connectionStats.active = this.activeConnections.size
    this.connectionStats.total++
    
    if (this.connectionStats.active > this.connectionStats.peak) {
      this.connectionStats.peak = this.connectionStats.active
    }
    
    this.checkThresholds()
    
    console.log(`🔗 Nova conexão registrada: ${endpoint} (${connectionId})`)
    console.log(`📊 Conexões ativas: ${this.connectionStats.active}/${this.maxConnections}`)
    
    return connectionId
  }

  // Liberar conexão
  releaseConnection(connectionId) {
    const connection = this.activeConnections.get(connectionId)
    if (connection) {
      const duration = new Date() - connection.startTime
      console.log(`✅ Conexão liberada: ${connection.endpoint} (duração: ${duration}ms)`)
      this.activeConnections.delete(connectionId)
      this.connectionStats.active = this.activeConnections.size
    }
  }

  // Verificar limites e gerar alertas
  checkThresholds() {
    const usage = this.connectionStats.active / this.maxConnections
    
    if (usage >= this.criticalThreshold) {
      this.addAlert('critical', `CRÍTICO: ${this.connectionStats.active}/${this.maxConnections} conexões ativas (${Math.round(usage * 100)}%)`)
    } else if (usage >= this.warningThreshold) {
      this.addAlert('warning', `AVISO: ${this.connectionStats.active}/${this.maxConnections} conexões ativas (${Math.round(usage * 100)}%)`)
    }
  }

  // Adicionar alerta
  addAlert(level, message) {
    const alert = {
      id: Date.now(),
      level,
      message,
      timestamp: new Date(),
      resolved: false
    }
    
    this.alerts.unshift(alert)
    
    // Manter apenas os últimos 50 alertas
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50)
    }
    
    console.log(`🚨 ${level.toUpperCase()}: ${message}`)
  }

  // Obter estatísticas atuais
  getStats() {
    return {
      ...this.connectionStats,
      usage: this.connectionStats.active / this.maxConnections,
      activeConnections: Array.from(this.activeConnections.values()),
      recentAlerts: this.alerts.slice(0, 10)
    }
  }

  // Middleware para Next.js
  middleware() {
    return async (request, response, next) => {
      const endpoint = request.url || request.nextUrl?.pathname || 'unknown'
      const connectionId = this.registerConnection(endpoint)
      
      // Adicionar connectionId ao request para uso posterior
      request.connectionId = connectionId
      
      // Interceptar o final da resposta para liberar a conexão
      const originalEnd = response.end
      response.end = (...args) => {
        this.releaseConnection(connectionId)
        return originalEnd.apply(response, args)
      }
      
      // Interceptar erros
      const originalJson = response.json
      response.json = (data) => {
        if (data && data.error) {
          this.connectionStats.errors++
        }
        return originalJson.call(response, data)
      }
      
      if (next) {
        return next()
      }
    }
  }

  // Resetar estatísticas
  resetStats() {
    this.connectionStats = {
      total: 0,
      active: this.activeConnections.size,
      peak: this.activeConnections.size,
      errors: 0,
      lastReset: new Date()
    }
    this.alerts = []
  }

  // Forçar limpeza de conexões antigas (mais de 30 segundos)
  cleanupStaleConnections() {
    const now = new Date()
    const staleThreshold = 30000 // 30 segundos
    
    for (const [id, connection] of this.activeConnections) {
      if (now - connection.startTime > staleThreshold) {
        console.log(`🧹 Limpando conexão antiga: ${connection.endpoint} (${id})`)
        this.activeConnections.delete(id)
      }
    }
    
    this.connectionStats.active = this.activeConnections.size
  }
}

// Instância singleton
const connectionMonitor = new ConnectionMonitor()

// Limpeza automática a cada 60 segundos
setInterval(() => {
  connectionMonitor.cleanupStaleConnections()
}, 60000)

export default connectionMonitor
export { ConnectionMonitor }