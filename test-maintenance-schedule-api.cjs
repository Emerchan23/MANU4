const mysql = require('mysql2/promise');

async function testMaintenanceScheduleAPI() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🔄 Testando dados do agendamento ID 8...');

        // 1. Verificar dados atuais do agendamento
        const [currentData] = await connection.execute(`
            SELECT 
                id,
                equipment_id,
                maintenance_type,
                description,
                scheduled_date,
                priority,
                assigned_user_id,
                estimated_cost,
                status,
                company_id,
                maintenance_plan_id,
                observations
            FROM maintenance_schedules 
            WHERE id = 8
        `);

        if (currentData.length === 0) {
            console.log('❌ Agendamento ID 8 não encontrado');
            return;
        }

        console.log('\n📊 Dados atuais do agendamento:');
        const schedule = currentData[0];
        Object.keys(schedule).forEach(key => {
            console.log(`  ${key}: ${schedule[key]}`);
        });

        // 2. Testar atualização com os novos campos
        console.log('\n🔄 Testando atualização com novos campos...');
        
        const testData = {
            company_id: 1,
            maintenance_plan_id: 2,
            observations: 'Teste de observações - campos funcionando corretamente'
        };

        const [updateResult] = await connection.execute(`
            UPDATE maintenance_schedules 
            SET 
                company_id = ?,
                maintenance_plan_id = ?,
                observations = ?,
                updated_at = NOW()
            WHERE id = 8
        `, [testData.company_id, testData.maintenance_plan_id, testData.observations]);

        console.log('✅ Atualização executada:', updateResult.affectedRows, 'linha(s) afetada(s)');

        // 3. Verificar dados após atualização
        const [updatedData] = await connection.execute(`
            SELECT 
                id,
                equipment_id,
                maintenance_type,
                description,
                scheduled_date,
                priority,
                assigned_user_id,
                estimated_cost,
                status,
                company_id,
                maintenance_plan_id,
                observations,
                updated_at
            FROM maintenance_schedules 
            WHERE id = 8
        `);

        console.log('\n📊 Dados após atualização:');
        const updatedSchedule = updatedData[0];
        Object.keys(updatedSchedule).forEach(key => {
            console.log(`  ${key}: ${updatedSchedule[key]}`);
        });

        console.log('\n✅ Teste concluído com sucesso!');

    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    } finally {
        await connection.end();
    }
}

testMaintenanceScheduleAPI();