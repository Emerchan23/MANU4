const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTableStructure() {
    let connection;
    
    try {
        console.log('🔍 VERIFICANDO ESTRUTURA DAS TABELAS...');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'hospital_maintenance'
        });

        console.log('✅ Conectado ao banco de dados');

        // Verificar estrutura da tabela maintenance_schedules
        console.log('\n📋 ESTRUTURA DA TABELA maintenance_schedules:');
        const [msColumns] = await connection.execute(`
            DESCRIBE maintenance_schedules
        `);
        
        msColumns.forEach(col => {
            console.log(`   ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key} - ${col.Default}`);
        });

        // Verificar se existe service_orders também
        console.log('\n📋 VERIFICANDO SE EXISTE service_orders:');
        try {
            const [soColumns] = await connection.execute(`
                DESCRIBE service_orders
            `);
            
            console.log('📋 ESTRUTURA DA TABELA service_orders:');
            soColumns.forEach(col => {
                console.log(`   ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key} - ${col.Default}`);
            });
        } catch (err) {
            console.log('⚠️ Tabela service_orders não existe ou erro:', err.message);
        }

        // Verificar últimos registros em maintenance_schedules
        console.log('\n📊 ÚLTIMOS REGISTROS EM maintenance_schedules:');
        const [records] = await connection.execute(`
            SELECT * FROM maintenance_schedules 
            ORDER BY created_at DESC 
            LIMIT 3
        `);
        
        if (records.length > 0) {
            records.forEach((record, index) => {
                console.log(`\n📅 REGISTRO ${index + 1}:`);
                Object.keys(record).forEach(key => {
                    console.log(`   ${key}: ${record[key]}`);
                });
            });
        } else {
            console.log('❌ NENHUM REGISTRO ENCONTRADO em maintenance_schedules');
        }

        return { success: true, msColumns, records };

    } catch (error) {
        console.error('❌ ERRO ao verificar estrutura:', error);
        return { success: false, error: error.message };
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkTableStructure().then(result => {
    console.log('\n📊 VERIFICAÇÃO CONCLUÍDA');
    process.exit(result.success ? 0 : 1);
});