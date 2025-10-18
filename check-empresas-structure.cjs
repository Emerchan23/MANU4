const mysql = require('mysql2/promise');

async function checkEmpresasStructure() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🔍 Verificando estrutura da tabela empresas...');

        // Verificar se a tabela existe
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'hospital_maintenance' 
            AND TABLE_NAME = 'empresas'
        `);

        if (tables.length === 0) {
            console.log('❌ Tabela empresas não existe');
            return;
        }

        // Verificar estrutura da tabela
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'hospital_maintenance' 
            AND TABLE_NAME = 'empresas'
            ORDER BY ORDINAL_POSITION
        `);

        console.log('📋 Estrutura da tabela empresas:');
        columns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        // Verificar dados existentes
        const [data] = await connection.execute('SELECT * FROM empresas LIMIT 5');
        console.log(`\n📊 Registros encontrados: ${data.length}`);
        if (data.length > 0) {
            console.log('Primeiros registros:');
            data.forEach((row, index) => {
                console.log(`  ${index + 1}:`, row);
            });
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await connection.end();
    }
}

checkEmpresasStructure().catch(console.error);