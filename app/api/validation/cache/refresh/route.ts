import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Clear existing cache
    await query('DELETE FROM dependency_cache WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)');

    // Rebuild cache for all active relationships
    const relationships = await query(`
      SELECT DISTINCT entity_type, entity_id
      FROM entity_relationships
      WHERE is_active = 1
    `);

    let cacheEntriesCreated = 0;

    for (const rel of relationships) {
      try {
        // Get dependency count for this entity
        const [dependencyResult] = await query(`
          SELECT COUNT(*) as dependency_count
          FROM entity_relationships
          WHERE parent_entity_type = ? AND parent_entity_id = ? AND is_active = 1
        `, [rel.entity_type, rel.entity_id]);

        // Insert into cache
        await query(`
          INSERT INTO dependency_cache (entity_type, entity_id, dependency_count, cache_data, created_at)
          VALUES (?, ?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
            dependency_count = VALUES(dependency_count),
            cache_data = VALUES(cache_data),
            created_at = NOW()
        `, [
          rel.entity_type,
          rel.entity_id,
          dependencyResult.dependency_count,
          JSON.stringify({
            lastUpdated: new Date().toISOString(),
            dependencyCount: dependencyResult.dependency_count
          })
        ]);

        cacheEntriesCreated++;
      } catch (error) {
        console.error(`Error caching entity ${rel.entity_type}:${rel.entity_id}:`, error);
      }
    }

    // Log the cache refresh
    await query(`
      INSERT INTO validation_logs (entity_type, entity_id, validation_type, validation_result, dependency_count, created_at)
      VALUES ('system', 0, 'cache_refresh', 'SUCCESS', ?, NOW())
    `, [cacheEntriesCreated]);

    return NextResponse.json({
      success: true,
      message: 'Cache atualizado com sucesso',
      entriesCreated: cacheEntriesCreated
    });
  } catch (error) {
    console.error('Error refreshing cache:', error);
    
    // Log the cache refresh failure
    await query(`
      INSERT INTO validation_logs (entity_type, entity_id, validation_type, validation_result, error_message, created_at)
      VALUES ('system', 0, 'cache_refresh', 'FAILED', ?, NOW())
    `, [error instanceof Error ? error.message : 'Unknown error']);

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}