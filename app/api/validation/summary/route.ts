import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get total entities count
    const [totalEntitiesResult] = await query(`
      SELECT COUNT(DISTINCT entity_type) as total_entities
      FROM entity_relationships
    `);

    // Get entities with dependencies count
    const [entitiesWithDepsResult] = await query(`
      SELECT COUNT(DISTINCT entity_type) as entities_with_deps
      FROM entity_relationships
      WHERE is_active = 1
    `);

    // Get total dependencies count
    const [totalDepsResult] = await query(`
      SELECT COUNT(*) as total_dependencies
      FROM entity_relationships
      WHERE is_active = 1
    `);

    // Get recent validations count (last 24 hours)
    const [recentValidationsResult] = await query(`
      SELECT COUNT(*) as recent_validations
      FROM validation_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);

    // Get critical issues count (validation failures)
    const [criticalIssuesResult] = await query(`
      SELECT COUNT(*) as critical_issues
      FROM validation_logs
      WHERE validation_result = 'FAILED'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    const summary = {
      totalEntities: totalEntitiesResult.total_entities || 0,
      entitiesWithDependencies: entitiesWithDepsResult.entities_with_deps || 0,
      totalDependencies: totalDepsResult.total_dependencies || 0,
      recentValidations: recentValidationsResult.recent_validations || 0,
      criticalIssues: criticalIssuesResult.critical_issues || 0
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching validation summary:', error);
    
    // Return default values if database tables don't exist yet
    const defaultSummary = {
      totalEntities: 0,
      entitiesWithDependencies: 0,
      totalDependencies: 0,
      recentValidations: 0,
      criticalIssues: 0
    };
    
    return NextResponse.json(defaultSummary);
  }
}