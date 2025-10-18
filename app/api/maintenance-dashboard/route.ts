import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../../lib/database.js'

// GET - Get maintenance dashboard metrics
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [MAINTENANCE-DASHBOARD] Iniciando busca de métricas...')
    
    const { searchParams } = new URL(request.url)
    const company_id = searchParams.get('company_id')

    // Verificar se as tabelas necessárias existem
    console.log('🔍 [MAINTENANCE-DASHBOARD] Verificando estrutura do banco...')
    
    try {
      // Verificar se a tabela maintenance_schedules existe
      const tableCheck = await query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'maintenance_schedules'
      `)
      
      if (tableCheck[0]?.count === 0) {
        console.log('⚠️ [MAINTENANCE-DASHBOARD] Tabela maintenance_schedules não existe, retornando dados vazios')
        return NextResponse.json({
          success: true,
          data: {
            metrics: {
              pending: 0,
              overdue: 0,
              completedThisMonth: 0,
              completionRate: 0
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
      }
    } catch (tableError) {
      console.error('❌ [MAINTENANCE-DASHBOARD] Erro ao verificar tabelas:', tableError)
      return NextResponse.json({
        success: true,
        data: {
          metrics: {
            pending: 0,
            overdue: 0,
            completedThisMonth: 0,
            completionRate: 0
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
    }

    // Get current date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Format dates for MySQL
    const formatDate = (date: Date) => date.toISOString().slice(0, 19).replace('T', ' ')
    const nowStr = formatDate(now)
    const startOfMonthStr = formatDate(startOfMonth)
    const endOfMonthStr = formatDate(endOfMonth)
    const next7DaysStr = formatDate(next7Days)

    console.log('📅 [MAINTENANCE-DASHBOARD] Período de análise:', { nowStr, startOfMonthStr, endOfMonthStr, next7DaysStr })

    // Base WHERE clause for company filtering
    const companyFilter = company_id ? 'AND e.company_id = ?' : ''
    const companyParams = company_id ? [company_id] : []

    // 1. Get pending schedules count - com tratamento de erro
    let pendingCount = 0
    try {
      const pendingCountQuery = `
        SELECT COUNT(*) as count 
        FROM maintenance_schedules ms 
        LEFT JOIN equipment e ON ms.equipment_id = e.id 
        WHERE ms.status IN ('SCHEDULED', 'agendado') ${companyFilter}
      `
      const pendingResult = await query(pendingCountQuery, companyParams)
      pendingCount = pendingResult[0]?.count || 0
      console.log('📊 [MAINTENANCE-DASHBOARD] Agendamentos pendentes:', pendingCount)
    } catch (error) {
      console.error('❌ [MAINTENANCE-DASHBOARD] Erro ao buscar pendentes:', error)
      pendingCount = 0
    }

    // 2. Get overdue schedules count - com tratamento de erro
    let overdueCount = 0
    try {
      const overdueCountQuery = `
        SELECT COUNT(*) as count 
        FROM maintenance_schedules ms 
        LEFT JOIN equipment e ON ms.equipment_id = e.id 
        WHERE ms.status IN ('SCHEDULED', 'agendado') 
        AND ms.scheduled_date < ? ${companyFilter}
      `
      const overdueResult = await query(overdueCountQuery, [nowStr, ...companyParams])
      overdueCount = overdueResult[0]?.count || 0
      console.log('📊 [MAINTENANCE-DASHBOARD] Agendamentos atrasados:', overdueCount)
    } catch (error) {
      console.error('❌ [MAINTENANCE-DASHBOARD] Erro ao buscar atrasados:', error)
      overdueCount = 0
    }

    // 3. Get completed schedules this month - com tratamento de erro
    let completedThisMonth = 0
    try {
      const completedCountQuery = `
        SELECT COUNT(*) as count 
        FROM maintenance_schedules ms 
        LEFT JOIN equipment e ON ms.equipment_id = e.id 
        WHERE ms.status IN ('COMPLETED', 'concluido', 'finalizado') 
        AND ms.completed_at >= ? 
        AND ms.completed_at <= ? ${companyFilter}
      `
      const completedParams = [startOfMonthStr, endOfMonthStr, ...companyParams]
      const completedResult = await query(completedCountQuery, completedParams)
      completedThisMonth = completedResult[0]?.count || 0
      console.log('📊 [MAINTENANCE-DASHBOARD] Concluídos este mês:', completedThisMonth)
    } catch (error) {
      console.error('❌ [MAINTENANCE-DASHBOARD] Erro ao buscar concluídos:', error)
      completedThisMonth = 0
    }

    // 4. Calculate completion rate - com tratamento de erro
    let completionRate = 0
    try {
      const totalScheduledQuery = `
        SELECT COUNT(*) as count 
        FROM maintenance_schedules ms 
        LEFT JOIN equipment e ON ms.equipment_id = e.id 
        WHERE ms.scheduled_date >= ? 
        AND ms.scheduled_date <= ? ${companyFilter}
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

    // 5. Get upcoming schedules (next 7 days) - com tratamento de erro
    let upcomingSchedules = []
    try {
      const upcomingQuery = `
        SELECT 
          ms.*,
          COALESCE(e.name, 'Equipamento não encontrado') as equipment_name,
          COALESCE(e.patrimonio, 'Código não informado') as equipment_code,
          COALESCE(mp.name, 'Plano não informado') as maintenance_plan_name,
          COALESCE(u.full_name, 'Usuário não atribuído') as assigned_user_name
        FROM maintenance_schedules ms
        LEFT JOIN equipment e ON ms.equipment_id = e.id
        LEFT JOIN maintenance_plans mp ON ms.maintenance_plan_id = mp.id
        LEFT JOIN users u ON ms.assigned_user_id = u.id
        WHERE ms.status IN ('SCHEDULED', 'agendado')
        AND ms.scheduled_date >= ?
        AND ms.scheduled_date <= ? ${companyFilter}
        ORDER BY ms.scheduled_date ASC
        LIMIT 10
      `
      const upcomingParams = [nowStr, next7DaysStr, ...companyParams]
      upcomingSchedules = await query(upcomingQuery, upcomingParams)
      console.log('📊 [MAINTENANCE-DASHBOARD] Próximos agendamentos:', upcomingSchedules.length)
    } catch (error) {
      console.error('❌ [MAINTENANCE-DASHBOARD] Erro ao buscar próximos agendamentos:', error)
      upcomingSchedules = []
    }

    // 6. Get overdue schedules details - com tratamento de erro
    let overdueSchedules = []
    try {
      const overdueDetailsQuery = `
        SELECT 
          ms.*,
          COALESCE(e.name, 'Equipamento não encontrado') as equipment_name,
          COALESCE(e.patrimonio, 'Código não informado') as equipment_code,
          COALESCE(mp.name, 'Plano não informado') as maintenance_plan_name,
          COALESCE(u.full_name, 'Usuário não atribuído') as assigned_user_name
        FROM maintenance_schedules ms
        LEFT JOIN equipment e ON ms.equipment_id = e.id
        LEFT JOIN maintenance_plans mp ON ms.maintenance_plan_id = mp.id
        LEFT JOIN users u ON ms.assigned_user_id = u.id
        WHERE ms.status IN ('OVERDUE', 'atrasado') ${companyFilter}
        ORDER BY ms.scheduled_date ASC
        LIMIT 10
      `
      overdueSchedules = await query(overdueDetailsQuery, companyParams)
      console.log('📊 [MAINTENANCE-DASHBOARD] Agendamentos atrasados detalhados:', overdueSchedules.length)
    } catch (error) {
      console.error('❌ [MAINTENANCE-DASHBOARD] Erro ao buscar detalhes dos atrasados:', error)
      overdueSchedules = []
    }

    // 7. Get monthly statistics (last 6 months) - com tratamento de erro
    let monthlyStats = []
    try {
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        const monthStartStr = formatDate(monthStart)
        const monthEndStr = formatDate(monthEnd)
        
        // Get scheduled count for the month
        const monthScheduledQuery = `
          SELECT COUNT(*) as count 
          FROM maintenance_schedules ms 
          LEFT JOIN equipment e ON ms.equipment_id = e.id 
          WHERE ms.scheduled_date >= ? 
          AND ms.scheduled_date <= ? ${companyFilter}
        `
        const monthScheduledParams = [monthStartStr, monthEndStr, ...companyParams]
        const scheduledResult = await query(monthScheduledQuery, monthScheduledParams)
        const scheduled = scheduledResult[0]?.count || 0

        // Get completed count for the month
        const monthCompletedQuery = `
          SELECT COUNT(*) as count 
          FROM maintenance_schedules ms 
          LEFT JOIN equipment e ON ms.equipment_id = e.id 
          WHERE ms.status IN ('COMPLETED', 'concluido', 'finalizado') 
          AND ms.completed_at >= ? 
          AND ms.completed_at <= ? ${companyFilter}
        `
        const monthCompletedParams = [monthStartStr, monthEndStr, ...companyParams]
        const completedResult = await query(monthCompletedQuery, monthCompletedParams)
        const completed = completedResult[0]?.count || 0

        // Get overdue count for the month
        const monthOverdueQuery = `
          SELECT COUNT(*) as count 
          FROM maintenance_schedules ms 
          LEFT JOIN equipment e ON ms.equipment_id = e.id 
          WHERE ms.status IN ('OVERDUE', 'atrasado') 
          AND ms.scheduled_date >= ? 
          AND ms.scheduled_date <= ? ${companyFilter}
        `
        const monthOverdueParams = [monthStartStr, monthEndStr, ...companyParams]
        const overdueResult = await query(monthOverdueQuery, monthOverdueParams)
        const overdue = overdueResult[0]?.count || 0

        monthlyStats.push({
          month: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          scheduled: scheduled || 0,
          completed: completed || 0,
          overdue: overdue || 0
        })
      }
      console.log('📊 [MAINTENANCE-DASHBOARD] Estatísticas mensais:', monthlyStats.length)
    } catch (error) {
      console.error('❌ [MAINTENANCE-DASHBOARD] Erro ao buscar estatísticas mensais:', error)
      monthlyStats = []
    }

    // 8. Get cost analysis - com tratamento de erro
    let costAnalysis = {
      estimatedTotal: 0,
      actualTotal: 0,
      variance: 0
    }
    try {
      const costQuery = `
        SELECT 
          ms.actual_cost,
          mp.estimated_cost
        FROM maintenance_schedules ms
        LEFT JOIN equipment e ON ms.equipment_id = e.id
        LEFT JOIN maintenance_plans mp ON ms.maintenance_plan_id = mp.id
        WHERE ms.status IN ('COMPLETED', 'concluido', 'finalizado')
        AND ms.completed_at >= ?
        AND ms.completed_at <= ? ${companyFilter}
      `
      const costParams = [startOfMonthStr, endOfMonthStr, ...companyParams]
      const costData = await query(costQuery, costParams)

      const estimatedTotal = costData?.reduce((sum: number, item: any) => 
        sum + (item.estimated_cost || 0), 0) || 0
      const actualTotal = costData?.reduce((sum: number, item: any) => 
        sum + (item.actual_cost || 0), 0) || 0
      const variance = estimatedTotal > 0 ? ((actualTotal - estimatedTotal) / estimatedTotal) * 100 : 0
      
      costAnalysis = {
        estimatedTotal,
        actualTotal,
        variance
      }
      console.log('📊 [MAINTENANCE-DASHBOARD] Análise de custos:', costAnalysis)
    } catch (error) {
      console.error('❌ [MAINTENANCE-DASHBOARD] Erro ao buscar análise de custos:', error)
      costAnalysis = {
        estimatedTotal: 0,
        actualTotal: 0,
        variance: 0
      }
    }

    // Transform schedules to match expected format
    const transformSchedule = (schedule: any) => ({
      id: schedule.id,
      equipment_name: schedule.equipment_name || 'Equipamento não encontrado',
      equipment_code: schedule.equipment_code || 'Código não informado',
      maintenance_type: schedule.maintenance_type || 'Tipo não informado',
      scheduled_date: schedule.scheduled_date,
      description: schedule.description || 'Descrição não informada',
      assigned_user_name: schedule.assigned_user_name || 'Usuário não atribuído',
      maintenance_plan_name: schedule.maintenance_plan_name || 'Plano não informado',
      priority: schedule.priority || 'medium',
      status: schedule.status
    })

    const transformedUpcoming = upcomingSchedules.map(transformSchedule)
    const transformedOverdue = overdueSchedules.map(transformSchedule)

    console.log('✅ [MAINTENANCE-DASHBOARD] Dashboard carregado com sucesso!')
    console.log('📊 [MAINTENANCE-DASHBOARD] Resumo final:', {
      pending: pendingCount,
      overdue: overdueCount,
      completedThisMonth,
      completionRate,
      upcomingCount: transformedUpcoming.length,
      overdueCount: transformedOverdue.length,
      monthlyStatsCount: monthlyStats.length
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
        upcomingSchedules: transformedUpcoming,
        overdueSchedules: transformedOverdue,
        monthlyStats,
        costAnalysis
      }
    })

  } catch (error) {
    console.error('❌ [MAINTENANCE-DASHBOARD] Erro crítico no dashboard:', error)
    
    // Retornar dados vazios em caso de erro crítico para evitar quebra da interface
    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          pending: 0,
          overdue: 0,
          completedThisMonth: 0,
          completionRate: 0
        },
        upcomingSchedules: [],
        overdueSchedules: [],
        monthlyStats: [],
        costAnalysis: {
          estimatedTotal: 0,
          actualTotal: 0,
          variance: 0
        }
      },
      error: 'Erro ao carregar dados do dashboard',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
}