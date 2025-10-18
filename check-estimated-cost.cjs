const mysql = require('mysql2/promise');

async function checkEstimatedCost() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🔍 Verificando o valor de estimated_cost no banco de dados...');
        
        const [result] = await connection.execute(`
            SELECT 
                id,
                estimated_cost,
                TYPEOF(estimated_cost) as tipo_dados
            FROM maintenance_schedules 
            WHERE id = 8
        `);
        
        if (result.length > 0) {
            const data = result[0];
            console.log('✅ Dados encontrados:');
            console.log(`   ID: ${data.id}`);
            console.log(`   estimated_cost: "${data.estimated_cost}"`);
            console.log(`   Tipo de dados: ${typeof data.estimated_cost}`);
            console.log(`   Valor convertido para string: "${data.estimated_cost?.toString()}"`);
            console.log(`   É null/undefined?: ${data.estimated_cost == null}`);
            console.log(`   É string vazia?: ${data.estimated_cost === ''}`);
            console.log(`   É zero?: ${data.estimated_cost == 0}`);
        } else {
            console.log('❌ Nenhum registro encontrado com ID 8');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await connection.end();
    }
}

checkEstimatedCost();