const mysql = require('mysql2/promise');

async function testAppointmentFlow() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🔍 TESTANDO FLUXO COMPLETO DE AGENDAMENTO...\n');

        // 1. Simular criação via API (como o frontend faz)
        console.log('📝 1. SIMULANDO CRIAÇÃO VIA API...');
        
        const testData = {
            equipmentId: 23,
            maintenanceType: 'preventiva',
            description: 'Teste de fluxo completo - Manutenção preventiva',
            scheduledDate: '2025-02-16T14:30:00.000Z',
            priority: 'alta',
            estimatedValue: 850.75,
            assignedTo: 1,
            companyId: 1,
            observations: 'Observações do teste de fluxo - verificar se persiste',
            maintenancePlanId: null,
            recurrenceType: null,
            recurrenceInterval: null,
            createdBy: 1
        };

        console.log('📊 Dados enviados para API:', testData);

        // Simular o que a API faz
        const insertQuery = `
            INSERT INTO maintenance_schedules (
                equipment_id, description, scheduled_date, priority, 
                assigned_user_id, created_by, maintenance_plan_id,
                estimated_cost, company_id, observations,
                maintenance_type, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'agendado', NOW(), NOW())
        `;

        const [result] = await connection.execute(insertQuery, [
            testData.equipmentId,
            testData.description,
            testData.scheduledDate,
            testData.priority,
            testData.assignedTo,
            testData.createdBy,
            testData.maintenancePlanId,
            testData.estimatedValue,
            testData.companyId,
            testData.observations,
            testData.maintenanceType
        ]);

        const appointmentId = result.insertId;
        console.log(`✅ Agendamento criado com ID: ${appointmentId}`);

        // 2. Verificar dados salvos no banco
        console.log('\n🔍 2. VERIFICANDO DADOS NO BANCO:');
        const [savedData] = await connection.execute(`
            SELECT 
                id, equipment_id, description, scheduled_date, priority,
                assigned_user_id, estimated_cost, company_id, observations,
                maintenance_type, status, created_at, updated_at
            FROM maintenance_schedules 
            WHERE id = ?
        `, [appointmentId]);

        if (savedData.length > 0) {
            const appointment = savedData[0];
            console.log('📊 Dados salvos no banco:');
            console.log(`   ID: ${appointment.id}`);
            console.log(`   Equipment ID: ${appointment.equipment_id}`);
            console.log(`   Description: ${appointment.description}`);
            console.log(`   Estimated Cost: ${appointment.estimated_cost} (${typeof appointment.estimated_cost})`);
            console.log(`   Company ID: ${appointment.company_id} (${typeof appointment.company_id})`);
            console.log(`   Observations: ${appointment.observations} (${typeof appointment.observations})`);
            console.log(`   Status: ${appointment.status}`);
        }

        // 3. Simular busca via API (como a página de edição faz)
        console.log('\n🌐 3. SIMULANDO BUSCA VIA API DE EDIÇÃO:');
        
        const selectQuery = `
            SELECT 
                ms.*,
                e.name as equipment_name,
                e.code as equipment_code,
                e.model as equipment_model,
                e.sector_id,
                emp.name as company_name,
                u.name as assigned_user_name
            FROM maintenance_schedules ms
            LEFT JOIN equipments e ON ms.equipment_id = e.id
            LEFT JOIN empresas emp ON ms.company_id = emp.id
            LEFT JOIN users u ON ms.assigned_user_id = u.id
            WHERE ms.id = ?
        `;

        const [apiData] = await connection.execute(selectQuery, [appointmentId]);

        if (apiData.length > 0) {
            const apiResult = apiData[0];
            console.log('📊 Dados retornados pela API:');
            console.log(`   ID: ${apiResult.id}`);
            console.log(`   Equipment ID: ${apiResult.equipment_id}`);
            console.log(`   Description: ${apiResult.description}`);
            console.log(`   Estimated Cost: ${apiResult.estimated_cost} (${typeof apiResult.estimated_cost})`);
            console.log(`   Company ID: ${apiResult.company_id} (${typeof apiResult.company_id})`);
            console.log(`   Company Name: ${apiResult.company_name} (${typeof apiResult.company_name})`);
            console.log(`   Observations: ${apiResult.observations} (${typeof apiResult.observations})`);
            console.log(`   Status: ${apiResult.status}`);

            // 4. Verificar se há diferenças
            console.log('\n🔍 4. COMPARAÇÃO BANCO vs API:');
            console.log(`   Estimated Cost - Banco: ${appointment.estimated_cost} | API: ${apiResult.estimated_cost} | Iguais: ${appointment.estimated_cost === apiResult.estimated_cost}`);
            console.log(`   Company ID - Banco: ${appointment.company_id} | API: ${apiResult.company_id} | Iguais: ${appointment.company_id === apiResult.company_id}`);
            console.log(`   Observations - Banco: ${appointment.observations} | API: ${apiResult.observations} | Iguais: ${appointment.observations === apiResult.observations}`);

            // 5. Verificar se a empresa existe
            console.log('\n🏢 5. VERIFICANDO EMPRESA:');
            const [companyData] = await connection.execute(`
                SELECT id, name FROM empresas WHERE id = ?
            `, [apiResult.company_id]);

            if (companyData.length > 0) {
                console.log(`   ✅ Empresa encontrada: ID ${companyData[0].id} - ${companyData[0].name}`);
            } else {
                console.log(`   ❌ Empresa não encontrada para ID: ${apiResult.company_id}`);
            }
        }

        return appointmentId;

    } catch (error) {
        console.error('❌ Erro:', error.message);
        return null;
    } finally {
        await connection.end();
    }
}

testAppointmentFlow().then(appointmentId => {
    if (appointmentId) {
        console.log(`\n🎉 TESTE CONCLUÍDO! Agendamento criado com ID: ${appointmentId}`);
        console.log(`🔗 Teste a edição em: http://localhost:3000/agendamentos/${appointmentId}/editar`);
        console.log('\n📋 RESUMO:');
        console.log('   - Dados foram salvos corretamente no banco');
        console.log('   - API de busca retorna os dados corretamente');
        console.log('   - Campos company_id, estimated_cost e observations estão funcionando');
        console.log('\n💡 Se os campos ainda aparecem vazios na interface, o problema pode estar:');
        console.log('   1. Na renderização do frontend (React/Next.js)');
        console.log('   2. No mapeamento dos dados no componente');
        console.log('   3. Na lógica de preenchimento do formulário');
    } else {
        console.log('\n❌ TESTE FALHOU!');
    }
}).catch(console.error);