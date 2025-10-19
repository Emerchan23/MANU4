const mysql = require('mysql2/promise');

async function checkEquipmentStructure() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🔍 Verificando estrutura da tabela equipment...');

        // Verificar se a tabela existe
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'hospital_maintenance' AND TABLE_NAME = 'equipment'
        `);

        if (tables.length === 0) {
            console.log('❌ Tabela equipment não existe!');
            return;
        }

        // Obter estrutura da tabela
        const [columns] = await connection.execute('DESCRIBE equipment');
        
        console.log('\n📋 ESTRUTURA DA TABELA equipment:');
        console.log('=' .repeat(80));
        columns.forEach(col => {
            console.log(`  ${col.Field.padEnd(25)} | ${col.Type.padEnd(30)} | ${col.Null} | ${col.Key} | ${col.Default}`);
        });

        // Verificar se há campo company_id
        const hasCompanyId = columns.find(col => col.Field === 'company_id');
        console.log('\n🔍 Campo company_id na tabela equipment:', hasCompanyId ? '✅ Existe' : '❌ Não existe');

        // Verificar alguns dados de exemplo
        console.log('\n📊 Dados de exemplo da tabela equipment:');
        const [equipmentData] = await connection.execute(`
            SELECT id, name, code, sector_id, status 
            FROM equipment 
            LIMIT 5
        `);
        
        equipmentData.forEach(eq => {
            console.log(`  ID: ${eq.id} | Nome: ${eq.name} | Código: ${eq.code} | Setor: ${eq.sector_id} | Status: ${eq.status}`);
        });

    } catch (error) {
        console.error('❌ Erro ao verificar estrutura:', error.message);
    } finally {
        await connection.end();
    }
}

checkEquipmentStructure();