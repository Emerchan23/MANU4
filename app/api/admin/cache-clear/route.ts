import { NextRequest, NextResponse } from 'next/server'
import cacheManager from '@/lib/cache-manager.js'

/**
 * Endpoint para limpar o cache
 */
export async function POST(request: NextRequest) {
  try {
    cacheManager.clear()
    
    return NextResponse.json({
      success: true,
      message: 'Cache limpo com sucesso',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ [CACHE-CLEAR] Erro:', error)
    
    return NextResponse.json({
      error: 'Erro ao limpar cache',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}