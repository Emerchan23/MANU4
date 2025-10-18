const mysql = require('mysql2/promise');

async function checkEquipmentCompanyRelation() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🔍 Verificando relacionamento entre equipment e companies...');

        // Verificar estrutura da tabela equipment
        const [equipmentColumns] = await connection.execute('DESCRIBE equipment');
        
        console.log('\n📋 ESTRUTURA DA TABELA equipment:');
        console.log('=' .repeat(80));
        equipmentColumns.forEach(col => {
            console.log(`  ${col.Field.padEnd(25)} | ${col.Type.padEnd(30)} | ${col.Null} | ${col.Key} | ${col.Default}`);
        });

        // Verificar se há campo company_id
        const hasCompanyId = equipmentColumns.some(col => col.Field === 'company_id');
        console.log(`\n🔍 Campo company_id existe na tabela equipment: ${hasCompanyId ? '✅ SIM' : '❌ NÃO'}`);

        // Verificar estrutura da tabela companies
        const [companiesColumns] = await connection.execute('DESCRIBE companies');
        
        console.log('\n📋 ESTRUTURA DA TABELA companies:');
        console.log('=' .repeat(80));
        companiesColumns.forEach(col => {
            console.log(`  ${col.Field.padEnd(25)} | ${col.Type.padEnd(30)} | ${col.Null} | ${col.Key} | ${col.Default}`);
        });

        // Verificar dados de exemplo com relacionamento
        if (hasCompanyId) {
            console.log('\n📊 Dados de exemplo com relacionamento equipment-company:');
            const [equipmentCompanyData] = await connection.execute(`
                SELECT 
                    e.id as equipment_id,
                    e.name as equipment_name,
                    e.company_id,
                    c.name as company_name,
                    c.type as company_type
                FROM equipment e
                LEFT JOIN companies c ON e.company_id = c.id
                LIMIT 5
            `);

            if (equipmentCompanyData.length > 0) {
                equipmentCompanyData.forEach((row, index) => {
                    console.log(`\n  ${index + 1}. Equipamento: ${row.equipment_name}`);
                    console.log(`     ID: ${row.equipment_id}`);
                    console.log(`     Company ID: ${row.company_id || 'NULL'}`);
                    console.log(`     Empresa: ${row.company_name || 'Sem empresa'}`);
                    console.log(`     Tipo: ${row.company_type || 'N/A'}`);
                });
            } else {
                console.log('  Nenhum equipamento encontrado');
            }
        }

        // Verificar se há agendamentos com equipamentos que têm empresas
        console.log('\n🔗 Verificando agendamentos com equipamentos que têm empresas:');
        
        let query;
        if (hasCompanyId) {
            query = `
                SELECT 
                    ms.id as schedule_id,
                    e.name as equipment_name,
                    c.name as company_name,
                    u.name as technician_name,
                    ms.scheduled_date,
                    ms.status
                FROM maintenance_schedules ms
                LEFT JOIN equipment e ON ms.equipment_id = e.id
                LEFT JOIN companies c ON e.company_id = c.id
                LEFT JOIN users u ON ms.assigned_user_id = u.id
                LIMIT 5
            `;
        } else {
            query = `
                SELECT 
                    ms.id as schedule_id,
                    e.name as equipment_name,
                    u.name as technician_name,
                    ms.scheduled_date,
                    ms.status
                FROM maintenance_schedules ms
                LEFT JOIN equipment e ON ms.equipment_id = e.id
                LEFT JOIN users u ON ms.assigned_user_id = u.id
                LIMIT 5
            `;
        }

        const [scheduleData] = await connection.execute(query);

        if (scheduleData.length > 0) {
            scheduleData.forEach((row, index) => {
                console.log(`\n  ${index + 1}. Agendamento: ${row.schedule_id}`);
                console.log(`     Equipamento: ${row.equipment_name || 'N/A'}`);
                if (hasCompanyId) {
                    console.log(`     Empresa: ${row.company_name || 'Sem empresa'}`);
                }
                console.log(`     Técnico: ${row.technician_name || 'Sem técnico'}`);
                console.log(`     Data: ${row.scheduled_date}`);
                console.log(`     Status: ${row.status}`);
            });
        } else {
            console.log('  Nenhum agendamento encontrado');
        }

        console.log('\n✅ Verificação concluída!');

    } catch (error) {
        console.error('❌ Erro ao verificar relacionamento:', error.message);
    } finally {
        await connection.end();
    }
}

checkEquipmentCompanyRelation();