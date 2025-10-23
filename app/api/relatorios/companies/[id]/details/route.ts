import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: 'ID da empresa inválido' },
        { status: 400 }
      )
    }

    // Buscar dados da empresa
    const companyData = await query(`
      SELECT 
        id,
        name,
        cnpj,
        contact_person,
        phone,
        email,
        address,
        city,
        state,
        zip_code,
        created_at
      FROM companies 
      WHERE id = ?
    `, [companyId])

    if (!companyData || companyData.length === 0) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      )
    }

    const company = companyData[0]

    // Construir query para ordens de serviço
    let serviceOrdersQuery = `
      SELECT 
        so.id,
        so.order_number,
        so.maintenance_type,
        so.description,
        so.priority,
        so.status,
        so.estimated_cost,
        so.actual_cost,
        so.scheduled_date,
        so.completion_date,
        so.created_at,
        e.name as equipment_name,
        e.code as equipment_code,
        s.name as sector_name,
        u.name as created_by_name
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN sectors s ON e.sector_id = s.id
      LEFT JOIN users u ON so.created_by = u.id
      WHERE so.company_id = ?
    `

    const queryParams: any[] = [companyId]

    // Adicionar filtros de data
    if (startDate && endDate) {
      serviceOrdersQuery += ` AND so.created_at >= ? AND so.created_at <= ?`
      queryParams.push(startDate, endDate)
    } else if (startDate) {
      serviceOrdersQuery += ` AND so.created_at >= ?`
      queryParams.push(startDate)
    } else if (endDate) {
      serviceOrdersQuery += ` AND so.created_at <= ?`
      queryParams.push(endDate)
    }

    serviceOrdersQuery += ` ORDER BY so.created_at DESC`

    const serviceOrders = await query(serviceOrdersQuery, queryParams)

    // Calcular estatísticas da empresa
    let statsQuery = `
      SELECT 
        COUNT(*) as total_services,
        COALESCE(SUM(actual_cost), 0) as total_cost,
        COALESCE(AVG(actual_cost), 0) as average_cost,
        COUNT(CASE WHEN status = 'CONCLUIDA' THEN 1 END) as completed_services,
        COUNT(CASE WHEN status = 'ABERTA' THEN 1 END) as open_services,
        COUNT(CASE WHEN status = 'EM_ANDAMENTO' THEN 1 END) as in_progress_services,
        COUNT(CASE WHEN maintenance_type = 'PREVENTIVA' THEN 1 END) as preventive_services,
        COUNT(CASE WHEN maintenance_type = 'CORRETIVA' THEN 1 END) as corrective_services,
        COUNT(CASE WHEN maintenance_type = 'EMERGENCIAL' THEN 1 END) as emergency_services,
        MIN(created_at) as first_service_date,
        MAX(created_at) as last_service_date
      FROM service_orders 
      WHERE company_id = ?
    `

    const statsParams: any[] = [companyId]

    if (startDate && endDate) {
      statsQuery += ` AND created_at >= ? AND created_at <= ?`
      statsParams.push(startDate, endDate)
    } else if (startDate) {
      statsQuery += ` AND created_at >= ?`
      statsParams.push(startDate)
    } else if (endDate) {
      statsQuery += ` AND created_at <= ?`
      statsParams.push(endDate)
    }

    const stats = await query(statsQuery, statsParams)

    // Buscar dados mensais para gráficos
    let monthlyQuery = `
      SELECT 
        YEAR(created_at) as year,
        MONTH(created_at) as month,
        COUNT(*) as services_count,
        COALESCE(SUM(actual_cost), 0) as monthly_cost
      FROM service_orders 
      WHERE company_id = ?
    `

    const monthlyParams: any[] = [companyId]

    if (startDate && endDate) {
      monthlyQuery += ` AND created_at >= ? AND created_at <= ?`
      monthlyParams.push(startDate, endDate)
    } else if (startDate) {
      monthlyQuery += ` AND created_at >= ?`
      monthlyParams.push(startDate)
    } else if (endDate) {
      monthlyQuery += ` AND created_at <= ?`
      monthlyParams.push(endDate)
    }

    monthlyQuery += ` GROUP BY YEAR(created_at), MONTH(created_at) ORDER BY year, month`

    const monthlyData = await query(monthlyQuery, monthlyParams)

    // Formatar dados mensais
    const formattedMonthlyData = monthlyData.map((item: any) => ({
      year: item.year,
      month: item.month,
      month_name: new Date(item.year, item.month - 1).toLocaleDateString('pt-BR', { month: 'long' }),
      services_count: parseInt(item.services_count),
      monthly_cost: parseFloat(item.monthly_cost)
    }))

    // Formatar ordens de serviço
    const formattedServiceOrders = serviceOrders.map((order: any) => ({
      id: order.id,
      order_number: order.order_number,
      maintenance_type: order.maintenance_type,
      description: order.description,
      priority: order.priority,
      status: order.status,
      estimated_cost: parseFloat(order.estimated_cost) || 0,
      actual_cost: parseFloat(order.actual_cost) || 0,
      scheduled_date: order.scheduled_date,
      completion_date: order.completion_date,
      created_at: order.created_at,
      equipment: {
        name: order.equipment_name,
        code: order.equipment_code
      },
      sector_name: order.sector_name,
      created_by_name: order.created_by_name
    }))

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        cnpj: company.cnpj,
        contact_person: company.contact_person,
        phone: company.phone,
        email: company.email,
        address: company.address,
        city: company.city,
        state: company.state,
        zip_code: company.zip_code,
        created_at: company.created_at
      },
      statistics: {
        total_services: parseInt(stats[0]?.total_services) || 0,
        total_cost: parseFloat(stats[0]?.total_cost) || 0,
        average_cost: parseFloat(stats[0]?.average_cost) || 0,
        completed_services: parseInt(stats[0]?.completed_services) || 0,
        open_services: parseInt(stats[0]?.open_services) || 0,
        in_progress_services: parseInt(stats[0]?.in_progress_services) || 0,
        preventive_services: parseInt(stats[0]?.preventive_services) || 0,
        corrective_services: parseInt(stats[0]?.corrective_services) || 0,
        emergency_services: parseInt(stats[0]?.emergency_services) || 0,
        first_service_date: stats[0]?.first_service_date,
        last_service_date: stats[0]?.last_service_date
      },
      service_orders: formattedServiceOrders,
      monthly_data: formattedMonthlyData,
      period: {
        start_date: startDate,
        end_date: endDate
      }
    })

  } catch (error) {
    console.error('Erro ao buscar detalhes da empresa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}