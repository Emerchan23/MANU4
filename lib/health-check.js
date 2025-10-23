/**
 * Sistema de Health Check e Circuit Breaker para MariaDB
 * Previne sobrecarga do banco de dados
 */

class HealthCheck {
  constructor() {
    this.status = 'healthy' // healthy, degraded, unhealthy
    this.circuitState = 'closed' // closed, open, half-open
    this.failureCount = 0
    this.lastFailureTime = null
    this.successCount = 0
    this.connectionStats = {
      active: 0,
      total: 0,
      errors: 0,
      lastCheck: null
    }
    
    // Configurações ajustadas para permitir mais requisições
    this.config = {
      failureThreshold: 10, // Aumentado para 10 falhas consecutivas
      recoveryTimeout: 15000, // Reduzido para 15s para recuperação mais rápida
      healthCheckInterval: 15000, // Aumentado para 15s entre verificações
      maxConnections: 25, // Aumentado para 25 conexões (alinhado com database.js)
      connectionWarningThreshold: 20 // Alerta quando atingir 80% de 25
    }
    
    // Iniciar monitoramento automático
    this.startHealthMonitoring()
  }
  
  /**
   * Verifica se o banco está saudável
   */
  async checkDatabaseHealth() {
    const mysql = await import('mysql2/promise')
    
    let connection
    const startTime = Date.now()
    
    try {
      // Configuração direta para evitar problemas de importação
      const testConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hospital_maintenance',
        port: parseInt(process.env.DB_PORT || '3306'),
        charset: 'utf8mb4',
        acquireTimeout: 5000,
        timeout: 5000
      }
      
      connection = await mysql.createConnection(testConfig)
      
      // Executar query simples para testar
      const [result] = await connection.execute('SELECT 1 as test')
      
      // Verificar estatísticas de conexão
      const [processlist] = await connection.execute(
        'SHOW PROCESSLIST'
      )
      
      const responseTime = Date.now() - startTime
      
      this.connectionStats = {
        active: processlist.length,
        total: processlist.length,
        errors: this.connectionStats.errors,
        lastCheck: new Date(),
        responseTime
      }
      
      // Determinar status baseado nas métricas
      this.updateHealthStatus(processlist.length, responseTime)
      
      // Reset failure count em caso de sucesso
      if (this.circuitState === 'half-open') {
        this.successCount++
        if (this.successCount >= 3) {
          this.circuitState = 'closed'
          this.failureCount = 0
          console.log('✅ [HEALTH-CHECK] Circuit breaker fechado - sistema recuperado')
        }
      } else if (this.circuitState === 'closed') {
        this.failureCount = 0
      }
      
      return {
        healthy: true,
        status: this.status,
        stats: this.connectionStats,
        circuitState: this.circuitState
      }
      
    } catch (error) {
      console.error('❌ [HEALTH-CHECK] Erro na verificação:', error.message)
      
      this.connectionStats.errors++
      this.failureCount++
      this.lastFailureTime = Date.now()
      
      // Abrir circuit breaker se muitas falhas
      if (this.failureCount >= this.config.failureThreshold && this.circuitState === 'closed') {
        this.circuitState = 'open'
        console.error('🚨 [HEALTH-CHECK] Circuit breaker ABERTO - sistema indisponível')
      }
      
      this.status = 'unhealthy'
      
      return {
        healthy: false,
        status: this.status,
        error: error.message,
        stats: this.connectionStats,
        circuitState: this.circuitState
      }
      
    } finally {
      if (connection) {
        try {
          await connection.end()
        } catch (e) {
          console.error('Erro ao fechar conexão de health check:', e.message)
        }
      }
    }
  }
  
  /**
   * Atualiza status baseado nas métricas
   */
  updateHealthStatus(activeConnections, responseTime) {
    if (activeConnections >= this.config.maxConnections) {
      this.status = 'unhealthy'
    } else if (activeConnections >= this.config.connectionWarningThreshold || responseTime > 3000) {
      this.status = 'degraded'
    } else {
      this.status = 'healthy'
    }
  }
  
  /**
   * Verifica se requisições devem ser permitidas
   */
  shouldAllowRequest() {
    const now = Date.now()
    
    switch (this.circuitState) {
      case 'closed':
        return true
        
      case 'open':
        // Verificar se é hora de tentar half-open
        if (now - this.lastFailureTime >= this.config.recoveryTimeout) {
          this.circuitState = 'half-open'
          this.successCount = 0
          console.log('🔄 [HEALTH-CHECK] Circuit breaker em half-open - testando recuperação')
          return true
        }
        return false
        
      case 'half-open':
        return true
        
      default:
        return false
    }
  }
  
  /**
   * Middleware para verificar health antes de executar queries
   */
  middleware() {
    return async (req, res, next) => {
      if (!this.shouldAllowRequest()) {
        return res.status(503).json({
          error: 'Serviço temporariamente indisponível',
          status: this.status,
          circuitState: this.circuitState,
          retryAfter: Math.ceil(this.config.recoveryTimeout / 1000)
        })
      }
      
      // Adicionar informações de health no header
      res.setHeader('X-Health-Status', this.status)
      res.setHeader('X-Circuit-State', this.circuitState)
      res.setHeader('X-Active-Connections', this.connectionStats.active)
      
      next()
    }
  }
  
  /**
   * Inicia monitoramento automático
   */
  startHealthMonitoring() {
    setInterval(async () => {
      try {
        await this.checkDatabaseHealth()
        
        // Log de alerta se conexões estão altas
        if (this.connectionStats.active >= this.config.connectionWarningThreshold) {
          console.warn(`⚠️ [HEALTH-CHECK] Conexões altas: ${this.connectionStats.active}/${this.config.maxConnections}`)
        }
        
      } catch (error) {
        console.error('Erro no monitoramento de health:', error.message)
      }
    }, this.config.healthCheckInterval)
    
    console.log('🏥 [HEALTH-CHECK] Monitoramento iniciado')
  }
  
  /**
   * Obtém estatísticas atuais
   */
  getStats() {
    return {
      status: this.status,
      circuitState: this.circuitState,
      failureCount: this.failureCount,
      connectionStats: this.connectionStats,
      config: this.config,
      lastFailureTime: this.lastFailureTime
    }
  }
  
  /**
   * Reset manual do circuit breaker
   */
  resetCircuitBreaker() {
    this.circuitState = 'closed'
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = null
    console.log('🔄 [HEALTH-CHECK] Circuit breaker resetado manualmente')
  }
}

// Instância singleton
const healthCheck = new HealthCheck()

export default healthCheck