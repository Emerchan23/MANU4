import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database.js'
// import rateLimiter from '../../../lib/rate-limiter.js' // Temporariamente desabilitado

// Função de debug para testar queries diretamente
async function testQuery(sql: string, params: any[] = []) {
  try {
    console.log('🧪 [DEBUG] Testando query:', sql)
    console.log('🧪 [DEBUG] Parâmetros:', params)
    const result = await query(sql, params)
    console.log('🧪 [DEBUG] Resultado:', result)
    return result
  } catch (error) {
    console.error('🧪 [DEBUG] Erro na query:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  console.log('🔍 [MAINTENANCE-DASHBOARD] ===== INICIANDO REQUISIÇÃO DO DASHBOARD =====')
  
  try {
    console.log('🔄 [MAINTENANCE-DASHBOARD] Carregando dados reais do banco...')
    
    // Get company_id from query parameters
    const { searchParams } = new URL(request.url)
    const company_id = searchParams.get('company_id')
    console.log('📋 [MAINTENANCE-DASHBOARD] Company ID:', company_id)

    // Check if maintenance_schedules table exists
    console.log('🔍 [MAINTENANCE-DASHBOARD] ===== VERIFICANDO TABELA MAINTENANCE_SCHEDULES =====')
    try {
      const tableCheckQuery = "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'maintenance_schedules'"
      console.log('🔍 [MAINTENANCE-DASHBOARD] Query de verificação de tabela:', tableCheckQuery)
      
      const tableResult = await query(tableCheckQuery)
      console.log('🔍 [MAINTENANCE-DASHBOARD] Resultado da verificação de tabela:', tableResult)
      
      if (!tableResult || !Array.isArray(tableResult) || tableResult.length === 0) {
        console.error('❌ [MAINTENANCE-DASHBOARD] Resultado da verificação de tabela inválido:', tableResult)
        return NextResponse.json({
          success: false,
          error: 'Erro ao verificar estrutura do banco de dados - resultado inválido'
        }, { status: 500 })
      }
      
      const tableExists = tableResult[0]
      console.log('🔍 [MAINTENANCE-DASHBOARD] Primeira linha do resultado:', tableExists)
      
      if (!tableExists || tableExists.count === 0) {
        console.log('❌ [MAINTENANCE-DASHBOARD] Tabela maintenance_schedules não existe')
        return NextResponse.json({
          success: false,
          error: 'Tabela maintenance_schedules não encontrada'
        }, { status: 500 })
      }
      console.log('✅ [MAINTENANCE-DASHBOARD] Tabela maintenance_schedules existe')
    } catch (tableError) {
      console.error('❌ [MAINTENANCE-DASHBOARD] Erro ao verificar tabelas:', tableError)
      console.error('❌ [MAINTENANCE-DASHBOARD] Stack trace da verificação de tabela:', tableError.stack)
      return NextResponse.json({
        success: false,
        error: 'Erro ao verificar estrutura do banco de dados',
        details: tableError.message
      }, { status: 500 })
    }

    // Aplicar filtro de empresa se fornecido
    console.log('🔍 [MAINTENANCE-DASHBOARD] ===== CONFIGURANDO FILTROS =====')
    console.log('🔍 [MAINTENANCE-DASHBOARD] Company ID recebido:', company_id)
    
    const companyFilter = company_id ? 'AND ms.company_id = ?' : ''
    const companyParams = company_id ? [company_id] : []
    console.log('🔍 [MAINTENANCE-DASHBOARD] Filtro de empresa:', { companyFilter, companyParams })

    // 1. Get pending schedules count
    console.log('📊 [MAINTENANCE-DASHBOARD] ===== BUSCANDO AGENDAMENTOS PENDENTES =====')
    let pendingCount = 0
    try {
      const pendingCountQuery = `
        SELECT COUNT(*) as count 
        FROM maintenance_schedules ms
        WHERE ms.status IN ('AGENDADA', 'SCHEDULED') ${companyFilter}
      `
      console.log('🔍 [MAINTENANCE-DASHBOARD] Query pendentes:', pendingCountQuery)
      console.log('🔍 [MAINTENANCE-DASHBOARD] Parâmetros pendentes:', companyParams)
      
      const pendingResult = await query(pendingCountQuery, companyParams)
      console.log('🔍 [MAINTENANCE-DASHBOARD] Resultado bruto pendentes:', pendingResult)
      
      if (!pendingResult || !Array.isArray(pendingResult) || pendingResult.length === 0) {
        console.error('❌ [MAINTENANCE-DASHBOARD] Resultado pendentes inválido:', pendingResult)
        pendingCount = 0
      } else {
        pendingCount = pendingResult[0]?.count || 0
        console.log('✅ [MAINTENANCE-DASHBOARD] Agendamentos pendentes:', pendingCount)
      }
    } catch (error) {
      console.error('❌ [MAINTENANCE-DASHBOARD] Erro ao buscar pendentes:', error)
      console.error('❌ [MAINTENANCE-DASHBOARD] Stack trace pendentes:', error.stack)
      pendingCount = 0
    }

    // 2. Get overdue schedules count
    console.log('📊 [MAINTENANCE-DASHBOARD] ===== BUSCANDO AGENDAMENTOS ATRASADOS =====')
    let overdueCount = 0
    try {
      const overdueCountQuery = `
        SELECT COUNT(*) as count 
        FROM maintenance_schedules ms 
        WHERE ms.status IN ('AGENDADA', 'SCHEDULED') 
        AND DATE(ms.scheduled_date) < CURDATE() ${companyFilter}
      `
      console.log('🔍 [MAINTENANCE-DASHBOARD] Query atrasados:', overdueCountQuery)
      console.log('🔍 [MAINTENANCE-DASHBOARD] Parâmetros atrasados:', companyParams)
      
      const overdueResult = await query(overdueCountQuery, companyParams)
      console.log('🔍 [MAINTENANCE-DASHBOARD] Resultado bruto atrasados:', overdueResult)
      
      if (!overdueResult || !Array.isArray(overdueResult) || overdueResult.length === 0) {
        console.error('❌ [MAINTENANCE-DASHBOARD] Resultado atrasados inválido:', overdueResult)
        overdueCount = 0
      } else {
        overdueCount = overdueResult[0]?.count || 0
        console.log('✅ [MAINTENANCE-DASHBOARD] Agendamentos atrasados:', overdueCount)
      }
    } catch (error) {
      console.error('❌ [MAINTENANCE-DASHBOARD] Erro ao buscar atrasados:', error)
      console.error('❌ [MAINTENANCE-DASHBOARD] Stack trace atrasados:', error.stack)
      overdueCount = 0
    }

    // 3. Get completed this month count
    console.log('📊 [MAINTENANCE-DASHBOARD] Buscando concluídos este mês...')
    let completedThisMonth = 0
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      function formatDate(date) {
        return date.toISOString().split('T')[0]
      }
      
      const startOfMonthStr = formatDate(startOfMonth)
      const endOfMonthStr = formatDate(endOfMonth)
      
      const completedCountQuery = `
        SELECT COUNT(*) as count 
        FROM maintenance_schedules ms 
        WHERE ms.status IN ('CONCLUIDA', 'COMPLETED') 
        AND DATE(ms.updated_at) >= DATE(?) 
        AND DATE(ms.updated_at) <= DATE(?) ${companyFilter}
      `
      const completedParams = [startOfMonthStr, endOfMonthStr, ...companyParams]
      console.log('Query concluídos:', completedCountQuery, 'Params:', completedParams)
      const completedResult = await query(completedCountQuery, completedParams)
      console.log('Resultado bruto concluídos:', completedResult)
      completedThisMonth = completedResult[0]?.count || 0
      console.log('✅ [MAINTENANCE-DASHBOARD] Concluídos este mês:', completedThisMonth)
    } catch (error) {
      console.error('❌ [MAINTENANCE-DASHBOARD] Erro ao buscar concluídos:', error)
      completedThisMonth = 0
    }

    // 4. Calculate completion rate
    let completionRate = 0
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      function formatDate(date) {
        return date.toISOString().split('T')[0]
      }
      
      const startOfMonthStr = formatDate(startOfMonth)
      const endOfMonthStr = formatDate(endOfMonth)
      
      const totalScheduledQuery = `
        SELECT COUNT(*) as count 
        FROM maintenance_schedules ms 
        WHERE DATE(ms.scheduled_date) >= DATE(?) 
        AND DATE(ms.scheduled_date) <= DATE(?) ${companyFilter}
      `
      const totalScheduledParams = [startOfMonthStr, endOfMonthStr, ...companyParams]
      const totalScheduledResult = await query(totalScheduledQuery, totalScheduledParams)
      const totalScheduledThisMonth = totalScheduledResult[0]?.count || 0
      completionRate = totalScheduledThisMonth > 0 
        ? Math.round((completedThisMonth / totalScheduledThisMonth) * 100)
        : 0
      console.log('📊 [MAINTENANCE-DASHBOARD] Taxa de conclusão:', completionRate + '%')
    } catch (error) {
      console.error('❌ [MAINTENANCE-DASHBOARD] Erro ao calcular taxa de conclusão:', error)
      completionRate = 0
    }

    console.log('✅ [MAINTENANCE-DASHBOARD] Dashboard carregado com sucesso!')
    console.log('📊 [MAINTENANCE-DASHBOARD] Resumo final:', {
      pending: pendingCount,
      overdue: overdueCount,
      completedThisMonth,
      completionRate
    })

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          pending: pendingCount,
          overdue: overdueCount,
          completedThisMonth,
          completionRate
        },
        upcomingSchedules: [],
        overdueSchedules: [],
        monthlyStats: [],
        costAnalysis: {
          estimatedTotal: 0,
          actualTotal: 0,
          variance: 0
        }
      }
    })

  } catch (error) {
    console.error('❌ [MAINTENANCE-DASHBOARD] Erro crítico no dashboard:', error)
    console.error('❌ [MAINTENANCE-DASHBOARD] Stack trace:', error.stack)
    
    // Retornar erro 500 para debug
    return NextResponse.json({
      success: false,
      error: 'Erro ao carregar dados do dashboard',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}