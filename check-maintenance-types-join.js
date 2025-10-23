import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function checkMaintenanceTypesJoin() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');

    // Verificar dados na tabela maintenance_types
    console.log('\n📋 Dados na tabela maintenance_types:');
    const [types] = await connection.execute(`
      SELECT id, name, description, category
      FROM maintenance_types 
      ORDER BY id
    `);

    types.forEach(type => {
      console.log(`   ID: ${type.id}, Nome: ${type.name}, Categoria: ${type.category}`);
    });

    // Testar o JOIN que está sendo usado na conversão
    console.log('\n🔍 Testando JOIN da conversão (service_orders com maintenance_types):');
    const [joinResult] = await connection.execute(`
      SELECT 
        so.id,
        so.maintenance_type_id,
        so.type,
        mt.id as mt_id,
        mt.name as maintenance_type_name
      FROM service_orders so
      LEFT JOIN maintenance_types mt ON so.maintenance_type_id = mt.id
      WHERE so.id IN (33, 34, 35)
      ORDER BY so.id
    `);

    joinResult.forEach(row => {
      console.log(`   OS ID: ${row.id}, maintenance_type_id: ${row.maintenance_type_id}, type: ${row.type}, mt_id: ${row.mt_id}, mt_name: ${row.maintenance_type_name}`);
    });

    // Verificar se existe o ID 11 na tabela maintenance_types
    console.log('\n🔍 Verificando se existe maintenance_type com ID 11:');
    const [type11] = await connection.execute(`
      SELECT id, name, description, category
      FROM maintenance_types 
      WHERE id = 11
    `);

    if (type11.length > 0) {
      console.log(`   ✅ Encontrado: ID: ${type11[0].id}, Nome: ${type11[0].name}`);
    } else {
      console.log('   ❌ Não encontrado maintenance_type com ID 11');
    }

    // Verificar total de tipos
    console.log('\n🔍 Verificando total de tipos:');
    const [totalTypes] = await connection.execute(`
      SELECT COUNT(*) as total
      FROM maintenance_types
    `);

    console.log(`   Total de tipos: ${totalTypes[0].total}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão encerrada');
    }
  }
}

checkMaintenanceTypesJoin();