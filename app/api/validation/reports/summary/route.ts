import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '7';

    // Get total validations
    const [totalValidationsResult] = await query(`
      SELECT COUNT(*) as total_validations
      FROM validation_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
    `);

    // Get successful validations
    const [successfulValidationsResult] = await query(`
      SELECT COUNT(*) as successful_validations
      FROM validation_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
        AND validation_result = 'SUCCESS'
    `);

    // Get failed validations
    const [failedValidationsResult] = await query(`
      SELECT COUNT(*) as failed_validations
      FROM validation_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
        AND validation_result = 'FAILED'
    `);

    // Get warning validations
    const [warningValidationsResult] = await query(`
      SELECT COUNT(*) as warning_validations
      FROM validation_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
        AND validation_result = 'WARNING'
    `);

    // Get entities with dependencies
    const [entitiesWithDepsResult] = await query(`
      SELECT COUNT(DISTINCT CONCAT(entity_type, '-', entity_id)) as entities_with_deps
      FROM validation_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
        AND dependency_count > 0
    `);

    // Get average dependencies per entity
    const [avgDependenciesResult] = await query(`
      SELECT AVG(dependency_count) as avg_dependencies
      FROM validation_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
        AND dependency_count > 0
    `);

    const summary = {
      totalValidations: totalValidationsResult.total_validations || 0,
      successfulValidations: successfulValidationsResult.successful_validations || 0,
      failedValidations: failedValidationsResult.failed_validations || 0,
      warningValidations: warningValidationsResult.warning_validations || 0,
      entitiesWithDependencies: entitiesWithDepsResult.entities_with_deps || 0,
      averageDependenciesPerEntity: avgDependenciesResult.avg_dependencies || 0
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching validation reports summary:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}