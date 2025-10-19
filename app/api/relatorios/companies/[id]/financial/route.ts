import { NextRequest, NextResponse } from 'next/server'
import { getConnection } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = parseInt(params.id)

    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: 'ID da empresa inválido' },
        { status: 400 }
      )
    }

    const connection = await getConnection()
    
    // Buscar informações da empresa
    const [companyRows] = await connection.execute(`
      SELECT 
        c.id,
        c.name,
        c.cnpj,
        c.contact_email,
        c.contact_phone
      FROM companies c
      WHERE c.id = ?
    `, [companyId])

    if (!companyRows || companyRows.length === 0) {
      await connection.end()
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      )
    }

    const company = companyRows[0]

    // Buscar estatísticas financeiras
    const [statsRows] = await connection.execute(`
      SELECT 
        COUNT(*) as total_services,
        COALESCE(SUM(estimated_cost), 0) as total_spent,
        COALESCE(AVG(estimated_cost), 0) as average_cost_per_service,
        MIN(scheduled_date) as first_service_date,
        MAX(scheduled_date) as last_service_date,
        COUNT(CASE WHEN status = 'CONCLUIDA' THEN 1 END) as completed_services,
        COUNT(CASE WHEN status = 'PENDENTE' THEN 1 END) as pending_services,
        COUNT(CASE WHEN status = 'EM_ANDAMENTO' THEN 1 END) as in_progress_services
      FROM (
        SELECT 
          estimated_cost, 
          scheduled_date, 
          status
        FROM maintenance_schedules 
        WHERE company_id = ?
        
        UNION ALL
        
        SELECT 
          estimated_cost, 
          scheduled_date, 
          status
        FROM service_orders 
        WHERE company_id = ?
      ) combined_services
    `, [companyId, companyId])

    // Buscar serviços detalhados
    const [servicesRows] = await connection.execute(`
      SELECT 
        ms.id,
        ms.scheduled_date as date,
        ms.maintenance_type as type,
        ms.description,
        ms.status,
        COALESCE(ms.estimated_cost, 0) as cost,
        e.name as equipment_name,
        e.code as equipment_code,
        COALESCE(u.name, 'Não atribuído') as technician_name
      FROM maintenance_schedules ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN users u ON ms.assigned_technician_id = u.id
      WHERE ms.company_id = ?
      
      UNION ALL
      
      SELECT 
        so.id,
        COALESCE(so.completed_at, so.scheduled_date, so.created_at) as date,
        so.maintenance_type as type,
        so.description,
        so.status,
        COALESCE(so.estimated_cost, 0) as cost,
        e.name as equipment_name,
        e.code as equipment_code,
        COALESCE(u.name, 'Não atribuído') as technician_name
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN users u ON so.assigned_technician_id = u.id
      WHERE so.company_id = ?
      
      ORDER BY date DESC
      LIMIT 50
    `, [companyId, companyId])

    // Buscar tipos de serviços mais frequentes
    const [serviceTypesRows] = await connection.execute(`
      SELECT 
        maintenance_type,
        COUNT(*) as count,
        COALESCE(SUM(estimated_cost), 0) as total_cost
      FROM (
        SELECT maintenance_type, estimated_cost
        FROM maintenance_schedules 
        WHERE company_id = ?
        
        UNION ALL
        
        SELECT maintenance_type, estimated_cost
        FROM service_orders 
        WHERE company_id = ?
      ) combined_services
      GROUP BY maintenance_type
      ORDER BY count DESC
      LIMIT 10
    `, [companyId, companyId])

    // Buscar gastos por mês (últimos 12 meses)
    const [monthlySpendingRows] = await connection.execute(`
      SELECT 
        DATE_FORMAT(scheduled_date, '%Y-%m') as month,
        COUNT(*) as service_count,
        COALESCE(SUM(estimated_cost), 0) as total_cost
      FROM (
        SELECT scheduled_date, estimated_cost
        FROM maintenance_schedules 
        WHERE company_id = ? 
          AND scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        
        UNION ALL
        
        SELECT scheduled_date, estimated_cost
        FROM service_orders 
        WHERE company_id = ? 
          AND scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      ) combined_services
      GROUP BY DATE_FORMAT(scheduled_date, '%Y-%m')
      ORDER BY month DESC
    `, [companyId, companyId])

    await connection.end()

    const stats = statsRows[0] || {
      total_services: 0,
      total_spent: 0,
      average_cost_per_service: 0,
      first_service_date: null,
      last_service_date: null,
      completed_services: 0,
      pending_services: 0,
      in_progress_services: 0
    }

    return NextResponse.json({
      company,
      statistics: {
        totalServices: parseInt(stats.total_services),
        totalSpent: parseFloat(stats.total_spent),
        averageCostPerService: parseFloat(stats.average_cost_per_service),
        firstServiceDate: stats.first_service_date,
        lastServiceDate: stats.last_service_date,
        completedServices: parseInt(stats.completed_services),
        pendingServices: parseInt(stats.pending_services),
        inProgressServices: parseInt(stats.in_progress_services)
      },
      services: servicesRows || [],
      serviceTypes: serviceTypesRows || [],
      monthlySpending: monthlySpendingRows || []
    })

  } catch (error) {
    console.error('Erro ao buscar relatório financeiro da empresa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}