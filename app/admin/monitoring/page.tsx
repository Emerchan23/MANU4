'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Zap,
  Clock,
  TrendingUp,
  Server
} from 'lucide-react'

interface HealthStatus {
  timestamp: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'error'
  healthy: boolean
  circuitBreaker: {
    state: 'closed' | 'open' | 'half-open'
    failureCount: number
    lastFailureTime: string | null
  }
  database: {
    connections: {
      active: number
      max: number
      warningThreshold: number
      percentage: number
    }
    responseTime: number
    errors: number
    lastCheck: string
  }
  system: {
    uptime: number
    memory: {
      rss: number
      heapTotal: number
      heapUsed: number
      external: number
    }
    version: string
  }
}

interface CacheStats {
  size: number
  maxSize: number
  hits: number
  misses: number
  hitRate: string
  memoryUsage: {
    bytes: number
    kb: string
    mb: string
  }
}

export default function MonitoringPage() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      
      if (response.ok) {
        setHealthStatus(data)
        setError(null)
      } else {
        setError(data.error || 'Erro ao buscar status')
      }
    } catch (err) {
      setError('Erro de conexão')
      console.error('Erro ao buscar health status:', err)
    }
  }

  const fetchCacheStats = async () => {
    try {
      const response = await fetch('/api/admin/cache-stats')
      if (response.ok) {
        const data = await response.json()
        setCacheStats(data)
      }
    } catch (err) {
      console.error('Erro ao buscar cache stats:', err)
    }
  }

  const resetCircuitBreaker = async () => {
    try {
      const response = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-circuit-breaker' })
      })
      
      if (response.ok) {
        await fetchHealthStatus()
      }
    } catch (err) {
      console.error('Erro ao resetar circuit breaker:', err)
    }
  }

  const clearCache = async () => {
    try {
      const response = await fetch('/api/admin/cache-clear', {
        method: 'POST'
      })
      
      if (response.ok) {
        await fetchCacheStats()
      }
    } catch (err) {
      console.error('Erro ao limpar cache:', err)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchHealthStatus(), fetchCacheStats()])
      setLoading(false)
    }

    loadData()

    if (autoRefresh) {
      const interval = setInterval(loadData, 10000) // 10 segundos
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'unhealthy': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'unhealthy': return <XCircle className="h-5 w-5 text-red-600" />
      default: return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Monitoramento do Sistema</h1>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button onClick={() => Promise.all([fetchHealthStatus(), fetchCacheStats()])}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status Geral */}
      {healthStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
              {getStatusIcon(healthStatus.status)}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getStatusColor(healthStatus.status)}`}>
                {healthStatus.status.toUpperCase()}
              </div>
              <p className="text-xs text-muted-foreground">
                Última verificação: {new Date(healthStatus.timestamp).toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Circuit Breaker</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant={healthStatus.circuitBreaker.state === 'closed' ? 'default' : 'destructive'}>
                  {healthStatus.circuitBreaker.state.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Falhas: {healthStatus.circuitBreaker.failureCount}
              </p>
              {healthStatus.circuitBreaker.state !== 'closed' && (
                <Button size="sm" className="mt-2" onClick={resetCircuitBreaker}>
                  Reset
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conexões DB</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {healthStatus.database.connections.active}/{healthStatus.database.connections.max}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${
                    healthStatus.database.connections.percentage > 80 ? 'bg-red-600' :
                    healthStatus.database.connections.percentage > 60 ? 'bg-yellow-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${healthStatus.database.connections.percentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {healthStatus.database.connections.percentage}% utilizado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {healthStatus.database.responseTime}ms
              </div>
              <p className="text-xs text-muted-foreground">
                Erros: {healthStatus.database.errors}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cache Statistics */}
      {cacheStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Estatísticas do Cache
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium">Entradas</p>
                <p className="text-2xl font-bold">{cacheStats.size}/{cacheStats.maxSize}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Taxa de Acerto</p>
                <p className="text-2xl font-bold text-green-600">{cacheStats.hitRate}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Hits/Misses</p>
                <p className="text-lg">{cacheStats.hits}/{cacheStats.misses}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Uso de Memória</p>
                <p className="text-lg">{cacheStats.memoryUsage.mb} MB</p>
              </div>
            </div>
            <Button className="mt-4" variant="outline" onClick={clearCache}>
              Limpar Cache
            </Button>
          </CardContent>
        </Card>
      )}

      {/* System Information */}
      {healthStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium">Uptime</p>
                <p className="text-lg font-semibold">{formatUptime(healthStatus.system.uptime)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Versão Node.js</p>
                <p className="text-lg font-semibold">{healthStatus.system.version}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Memória RSS</p>
                <p className="text-lg font-semibold">{formatBytes(healthStatus.system.memory.rss)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Heap Usado</p>
                <p className="text-lg font-semibold">{formatBytes(healthStatus.system.memory.heapUsed)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}