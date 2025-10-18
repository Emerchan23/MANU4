import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
};

export async function POST(request: NextRequest) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const { entityType, entityId, includeDetails = false } = await request.json();

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType e entityId são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar relacionamentos para a entidade
    const [relationships] = await connection.execute(
      'SELECT * FROM entity_relationships WHERE parent_entity = ? AND is_active = 1',
      [entityType]
    );

    const dependencies = [];
    let totalCount = 0;

    // Verificar cada relacionamento
    for (const relationship of relationships) {
      const [relatedRecords] = await connection.execute(
        `SELECT id FROM ${relationship.child_entity} WHERE ${relationship.foreign_key_column} = ?`,
        [entityId]
      );

      const count = relatedRecords.length;
      if (count > 0) {
        const dependencyInfo = {
          entityType: relationship.child_entity,
          entityName: getEntityDisplayName(relationship.child_entity),
          count,
          relationship: relationship.relationship_type,
          foreignKey: relationship.foreign_key_column,
          canDelete: relationship.cascade_delete
        };

        if (includeDetails && count <= 10) {
          // Buscar detalhes dos registros relacionados (máximo 10)
          const [detailedRecords] = await connection.execute(
            `SELECT * FROM ${relationship.child_entity} WHERE ${relationship.foreign_key_column} = ? LIMIT 10`,
            [entityId]
          );
          dependencyInfo.records = detailedRecords;
        }

        dependencies.push(dependencyInfo);
        totalCount += count;
      }
    }

    // Log da verificação de dependências
    await connection.execute(
      `INSERT INTO validation_logs (entity_type, entity_id, action_type, validation_result, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [
        entityType,
        entityId,
        'dependency_check',
        JSON.stringify({
          total_dependencies: totalCount,
          dependencies_found: dependencies.length,
          can_delete: dependencies.every(dep => dep.canDelete)
        })
      ]
    );

    return NextResponse.json({
      hasDependencies: totalCount > 0,
      totalCount,
      dependencies,
      canDelete: dependencies.every(dep => dep.canDelete),
      summary: {
        entityType,
        entityId,
        dependencyCount: dependencies.length,
        totalRecords: totalCount
      }
    });

  } catch (error) {
    console.error('Erro ao verificar dependências:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

function getEntityDisplayName(entityType: string): string {
  const entityNames = {
    'companies': 'Empresas',
    'departments': 'Departamentos',
    'locations': 'Localizações',
    'equipment': 'Equipamentos',
    'service_orders': 'Ordens de Serviço',
    'service_templates': 'Modelos de Serviço',
    'template_categories': 'Categorias de Modelo',
    'users': 'Usuários',
    'notifications': 'Notificações'
  };

  return entityNames[entityType] || entityType;
}