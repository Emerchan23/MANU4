const mysql = require('mysql2/promise');

async function checkMaintenanceSchedulesStructure() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🔍 Verificando estrutura da tabela maintenance_schedules...');

        // Verificar se a tabela existe
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'hospital_maintenance' AND TABLE_NAME = 'maintenance_schedules'
        `);

        if (tables.length === 0) {
            console.log('❌ Tabela maintenance_schedules não existe!');
            return;
        }

        // Obter estrutura da tabela
        const [columns] = await connection.execute('DESCRIBE maintenance_schedules');
        
        console.log('\n📋 ESTRUTURA DA TABELA maintenance_schedules:');
        console.log('=' .repeat(80));
        columns.forEach(col => {
            console.log(`  ${col.Field.padEnd(25)} | ${col.Type.padEnd(30)} | ${col.Null} | ${col.Key} | ${col.Default}`);
        });

        // Verificar se há campos relacionados a empresa/técnico
        console.log('\n🔍 Verificando campos relacionados a empresa/técnico:');
        const companyFields = columns.filter(col => 
            col.Field.includes('company') || 
            col.Field.includes('empresa') ||
            col.Field.includes('technician') ||
            col.Field.includes('tecnico')
        );

        if (companyFields.length > 0) {
            console.log('✅ Campos encontrados:');
            companyFields.forEach(field => {
                console.log(`  - ${field.Field}: ${field.Type}`);
            });
        } else {
            console.log('❌ Nenhum campo relacionado a empresa/técnico encontrado');
        }

        // Verificar dados de exemplo
        const [sampleData] = await connection.execute(`
            SELECT 
                ms.*,
                e.name as equipment_name,
                u.name as assigned_user_name
            FROM maintenance_schedules ms
            LEFT JOIN equipment e ON ms.equipment_id = e.id
            LEFT JOIN users u ON ms.assigned_user_id = u.id
            LIMIT 3
        `);

        console.log('\n📊 Dados de exemplo:');
        if (sampleData.length > 0) {
            sampleData.forEach((row, index) => {
                console.log(`\n  ${index + 1}. Agendamento ID: ${row.id}`);
                console.log(`     Equipamento: ${row.equipment_name || 'N/A'}`);
                console.log(`     Usuário Atribuído: ${row.assigned_user_name || 'Não atribuído'}`);
                console.log(`     Data: ${row.scheduled_date}`);
                console.log(`     Status: ${row.status}`);
            });
        } else {
            console.log('  Nenhum dado encontrado');
        }

        // Verificar relacionamento com companies através de equipment
        console.log('\n🔗 Verificando relacionamento com empresas através de equipamentos:');
        const [equipmentCompanyData] = await connection.execute(`
            SELECT 
                ms.id as schedule_id,
                e.name as equipment_name,
                c.name as company_name,
                u.name as technician_name
            FROM maintenance_schedules ms
            LEFT JOIN equipment e ON ms.equipment_id = e.id
            LEFT JOIN companies c ON e.company_id = c.id
            LEFT JOIN users u ON ms.assigned_user_id = u.id
            LIMIT 3
        `);

        if (equipmentCompanyData.length > 0) {
            equipmentCompanyData.forEach((row, index) => {
                console.log(`\n  ${index + 1}. Agendamento: ${row.schedule_id}`);
                console.log(`     Equipamento: ${row.equipment_name || 'N/A'}`);
                console.log(`     Empresa: ${row.company_name || 'Sem empresa'}`);
                console.log(`     Técnico: ${row.technician_name || 'Sem técnico'}`);
            });
        } else {
            console.log('  Nenhum relacionamento encontrado');
        }

        console.log('\n✅ Verificação concluída!');

    } catch (error) {
        console.error('❌ Erro ao verificar estrutura:', error.message);
    } finally {
        await connection.end();
    }
}

checkMaintenanceSchedulesStructure();