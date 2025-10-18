import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { entityType: string; id: string } }
) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const { entityType, id } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    if (!entityType || !id) {
      return NextResponse.json(
        { error: 'entityType e id são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar informações da entidade principal
    const [entityInfo] = await connection.execute(
      `SELECT * FROM ${entityType} WHERE id = ?`,
      [id]
    );

    if (entityInfo.length === 0) {
      return NextResponse.json(
        { error: 'Entidade não encontrada' },
        { status: 404 }
      );
    }

    // Buscar relacionamentos para a entidade
    const [relationships] = await connection.execute(
      'SELECT * FROM entity_relationships WHERE parent_entity = ? AND is_active = 1',
      [entityType]
    );

    const dependencies = [];
    let totalCount = 0;

    // Para cada relacionamento, buscar os registros dependentes
    for (const relationship of relationships) {
      // Contar total de registros
      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as total FROM ${relationship.child_entity} WHERE ${relationship.foreign_key_column} = ?`,
        [id]
      );
      const count = countResult[0].total;

      if (count > 0) {
        // Buscar registros paginados
        const [records] = await connection.execute(
          `SELECT * FROM ${relationship.child_entity} WHERE ${relationship.foreign_key_column} = ? LIMIT ? OFFSET ?`,
          [id, limit, offset]
        );

        dependencies.push({
          entityType: relationship.child_entity,
          entityName: getEntityDisplayName(relationship.child_entity),
          relationshipType: relationship.relationship_type,
          foreignKey: relationship.foreign_key_column,
          totalCount: count,
          records: records,
          canDelete: relationship.cascade_delete,
          pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        });

        totalCount += count;
      }
    }

    // Log da consulta de dependências
    await connection.execute(
      `INSERT INTO validation_logs (entity_type, entity_id, action_type, validation_result, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [
        entityType,
        id,
        'dependency_view',
        JSON.stringify({
          total_dependencies: totalCount,
          dependencies_types: dependencies.length,
          page,
          limit
        })
      ]
    );

    return NextResponse.json({
      entity: entityInfo[0],
      entityType,
      entityName: getEntityDisplayName(entityType),
      dependencies,
      summary: {
        totalDependencies: totalCount,
        dependencyTypes: dependencies.length,
        canDelete: dependencies.every(dep => dep.canDelete && dep.totalCount === 0)
      },
      pagination: {
        page,
        limit,
        hasMore: dependencies.some(dep => dep.pagination.page < dep.pagination.totalPages)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dependências:', error);
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