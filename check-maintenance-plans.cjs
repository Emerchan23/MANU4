const mysql = require('mysql2/promise');

async function checkMaintenancePlansTable() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🔍 Verificando se a tabela maintenance_plans existe...');
        
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'hospital_maintenance' 
            AND TABLE_NAME = 'maintenance_plans'
        `);
        
        if (tables.length === 0) {
            console.log('❌ Tabela maintenance_plans NÃO existe!');
            console.log('📋 Listando todas as tabelas disponíveis:');
            
            const [allTables] = await connection.execute(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = 'hospital_maintenance'
                ORDER BY TABLE_NAME
            `);
            
            allTables.forEach(table => {
                console.log('  - ' + table.TABLE_NAME);
            });
        } else {
            console.log('✅ Tabela maintenance_plans existe!');
            
            // Verificar estrutura da tabela
            const [columns] = await connection.execute(`
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'hospital_maintenance' 
                AND TABLE_NAME = 'maintenance_plans'
                ORDER BY ORDINAL_POSITION
            `);
            
            console.log('📊 Estrutura da tabela maintenance_plans:');
            columns.forEach(col => {
                console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
            });
            
            // Verificar dados na tabela
            const [data] = await connection.execute('SELECT COUNT(*) as total FROM maintenance_plans');
            console.log(`📈 Total de registros: ${data[0].total}`);
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await connection.end();
    }
}

checkMaintenancePlansTable();