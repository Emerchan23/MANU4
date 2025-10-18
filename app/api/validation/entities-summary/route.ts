import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get summary by entity type
    const entitiesSummary = await query(`
      SELECT 
        entity_type,
        COUNT(*) as total_records,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as records_with_dependencies,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as dependency_count
      FROM entity_relationships
      GROUP BY entity_type
      ORDER BY entity_type
    `);

    // Transform the data to include user-friendly names
    const entityNames: Record<string, string> = {
      companies: 'Empresas',
      sectors: 'Setores',
      subsectors: 'Subsetores',
      equipment: 'Equipamentos',
      users: 'Usuários',
      service_orders: 'Ordens de Serviço',
      alerts: 'Alertas',
      specialties: 'Especialidades',
      template_categories: 'Categorias de Template',
      service_templates: 'Templates de Serviço'
    };

    const formattedSummary = entitiesSummary.map((entity: any) => ({
      entityType: entity.entity_type,
      entityName: entityNames[entity.entity_type] || entity.entity_type,
      totalRecords: entity.total_records || 0,
      recordsWithDependencies: entity.records_with_dependencies || 0,
      dependencyCount: entity.dependency_count || 0
    }));

    return NextResponse.json(formattedSummary);
  } catch (error) {
    console.error('Error fetching entities summary:', error);
    
    // Return empty array if database tables don't exist yet
    return NextResponse.json([]);
  }
}