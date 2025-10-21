import { NextRequest, NextResponse } from 'next/server'
import cacheManager from '@/lib/cache-manager.js'

/**
 * Endpoint para obter estatísticas do cache
 */
export async function GET(request: NextRequest) {
  try {
    const stats = cacheManager.getStats()
    
    return NextResponse.json({
      ...stats,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ [CACHE-STATS] Erro:', error)
    
    return NextResponse.json({
      error: 'Erro ao obter estatísticas do cache',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}