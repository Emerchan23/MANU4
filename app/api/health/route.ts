import { NextRequest, NextResponse } from 'next/server'
import healthCheck from '@/lib/health-check.js'

/**
 * Endpoint de Health Check para monitorar status do sistema
 */
export async function GET(request: NextRequest) {
  try {
    const healthStatus = await healthCheck.checkDatabaseHealth()
    const stats = healthCheck.getStats()
    
    const response = {
      timestamp: new Date().toISOString(),
      status: healthStatus.status,
      healthy: healthStatus.healthy,
      circuitBreaker: {
        state: stats.circuitState,
        failureCount: stats.failureCount,
        lastFailureTime: stats.lastFailureTime
      },
      database: {
        connections: {
          active: stats.connectionStats.active,
          max: stats.config.maxConnections,
          warningThreshold: stats.config.connectionWarningThreshold,
          percentage: Math.round((stats.connectionStats.active / stats.config.maxConnections) * 100)
        },
        responseTime: stats.connectionStats.responseTime,
        errors: stats.connectionStats.errors,
        lastCheck: stats.connectionStats.lastCheck
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      }
    }
    
    // Status HTTP baseado na saúde do sistema
    const statusCode = healthStatus.healthy ? 200 : 503
    
    return NextResponse.json(response, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': healthStatus.status,
        'X-Circuit-State': stats.circuitState
      }
    })
    
  } catch (error) {
    console.error('❌ [HEALTH-API] Erro no health check:', error)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      healthy: false,
      error: error.message,
      circuitBreaker: {
        state: 'unknown'
      }
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': 'error'
      }
    })
  }
}

/**
 * Reset manual do circuit breaker (apenas para administradores)
 */
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'reset-circuit-breaker') {
      healthCheck.resetCircuitBreaker()
      
      return NextResponse.json({
        success: true,
        message: 'Circuit breaker resetado com sucesso',
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json({
      error: 'Ação não reconhecida'
    }, { status: 400 })
    
  } catch (error) {
    console.error('❌ [HEALTH-API] Erro no reset:', error)
    
    return NextResponse.json({
      error: 'Erro interno do servidor',
      message: error.message
    }, { status: 500 })
  }
}