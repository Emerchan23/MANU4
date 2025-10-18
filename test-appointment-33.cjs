const mysql = require('mysql2/promise');

async function testAppointment33() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🔄 Testando agendamento ID 33 (recém-criado)...');

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
            WHERE id = 33
        `);

        if (currentData.length === 0) {
            console.log('❌ Agendamento ID 33 não encontrado');
            return;
        }

        console.log('\n📊 Dados atuais do agendamento ID 33:');
        const schedule = currentData[0];
        Object.keys(schedule).forEach(key => {
            console.log(`  ${key}: ${schedule[key]}`);
        });

        // 2. Testar via API HTTP
        console.log('\n🌐 Testando via API HTTP...');
        const fetch = (await import('node-fetch')).default;
        
        try {
            const response = await fetch('http://localhost:3000/api/maintenance-schedules/33');
            const apiData = await response.json();
            
            if (apiData.success) {
                console.log('✅ API retornou dados com sucesso:');
                console.log(`   ID: ${apiData.data.id}`);
                console.log(`   Equipamento: ${apiData.data.equipment_name} (ID: ${apiData.data.equipment_id})`);
                console.log(`   Empresa: ${apiData.data.company_name || 'Não definida'} (ID: ${apiData.data.company_id || 'null'})`);
                console.log(`   Responsável: ${apiData.data.assigned_user_name || 'Não definido'} (ID: ${apiData.data.assigned_user_id || 'null'})`);
                console.log(`   Tipo Manutenção: ${apiData.data.maintenance_type || 'Não definido'}`);
                console.log(`   Status: ${apiData.data.status || 'Não definido'}`);
                console.log(`   Custo Estimado: R$ ${apiData.data.estimated_cost || '0.00'}`);
                console.log(`   Observações: ${apiData.data.observations || 'Nenhuma'}`);
                console.log(`   Plano Manutenção ID: ${apiData.data.maintenance_plan_id || 'null'}`);
                
                // Verificar se os campos problemáticos estão presentes
                console.log('\n🔍 Verificação dos campos problemáticos:');
                console.log(`   company_id: ${apiData.data.company_id} (${typeof apiData.data.company_id})`);
                console.log(`   estimated_cost: ${apiData.data.estimated_cost} (${typeof apiData.data.estimated_cost})`);
                console.log(`   observations: ${apiData.data.observations} (${typeof apiData.data.observations})`);
                
            } else {
                console.log('❌ API retornou erro:', apiData.error);
            }
        } catch (error) {
            console.log('❌ Erro na requisição HTTP:', error.message);
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await connection.end();
    }
}

testAppointment33().catch(console.error);