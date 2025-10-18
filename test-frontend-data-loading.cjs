const mysql = require('mysql2/promise');

async function testFrontendDataLoading() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🔄 Testando carregamento de dados para o frontend...');
        
        // 1. Testar dados do agendamento ID 8
        console.log('\n📋 1. Dados do agendamento ID 8:');
        const [scheduleData] = await connection.execute(`
            SELECT 
                ms.*,
                e.name as equipment_name,
                e.patrimonio as equipment_code,
                e.model as equipment_model,
                e.sector_id,
                c.name as company_name,
                u.name as assigned_user_name
            FROM maintenance_schedules ms
            LEFT JOIN equipment e ON ms.equipment_id = e.id
            LEFT JOIN empresas c ON ms.company_id = c.id
            LEFT JOIN users u ON ms.assigned_user_id = u.id
            WHERE ms.id = 8
        `);
        
        if (scheduleData.length > 0) {
            const data = scheduleData[0];
            console.log('✅ Dados do agendamento:');
            console.log(`   equipment_id: ${data.equipment_id} (${typeof data.equipment_id})`);
            console.log(`   company_id: ${data.company_id} (${typeof data.company_id})`);
            console.log(`   assigned_user_id: ${data.assigned_user_id} (${typeof data.assigned_user_id})`);
            console.log(`   maintenance_type: "${data.maintenance_type}" (${typeof data.maintenance_type})`);
            console.log(`   status: "${data.status}" (${typeof data.status})`);
            console.log(`   estimated_cost: ${data.estimated_cost} (${typeof data.estimated_cost})`);
            console.log(`   observations: "${data.observations}" (${typeof data.observations})`);
            console.log(`   maintenance_plan_id: ${data.maintenance_plan_id} (${typeof data.maintenance_plan_id})`);
        }

        // 2. Testar dados de empresas disponíveis
        console.log('\n🏢 2. Empresas disponíveis:');
        const [companies] = await connection.execute('SELECT id, name FROM empresas ORDER BY name');
        console.log(`   Total de empresas: ${companies.length}`);
        companies.forEach(company => {
            console.log(`   - ID ${company.id}: ${company.name}`);
        });

        // 3. Testar dados de usuários disponíveis
        console.log('\n👥 3. Usuários disponíveis:');
        const [users] = await connection.execute('SELECT id, name FROM users ORDER BY name');
        console.log(`   Total de usuários: ${users.length}`);
        users.forEach(user => {
            console.log(`   - ID ${user.id}: ${user.name}`);
        });

        // 4. Verificar se as APIs auxiliares estão funcionando
        console.log('\n🌐 4. Testando APIs auxiliares...');
        const fetch = (await import('node-fetch')).default;
        
        try {
            // Testar API de empresas
            const companiesResponse = await fetch('http://localhost:3000/api/companies');
            const companiesData = await companiesResponse.json();
            console.log(`   API /api/companies: ${companiesData.success ? '✅ OK' : '❌ ERRO'}`);
            if (companiesData.success) {
                console.log(`   - ${companiesData.data?.length || 0} empresas retornadas`);
            }

            // Testar API de usuários
            const usersResponse = await fetch('http://localhost:3000/api/users');
            const usersData = await usersResponse.json();
            console.log(`   API /api/users: ${usersData.success ? '✅ OK' : '❌ ERRO'}`);
            if (usersData.success) {
                console.log(`   - ${usersData.data?.length || 0} usuários retornados`);
            }

            // Testar API de tipos de manutenção
            const typesResponse = await fetch('http://localhost:3000/api/maintenance-types');
            const typesData = await typesResponse.json();
            console.log(`   API /api/maintenance-types: ${typesData.success ? '✅ OK' : '❌ ERRO'}`);
            if (typesData.success) {
                console.log(`   - ${typesData.data?.length || 0} tipos retornados`);
            }

        } catch (apiError) {
            console.log('❌ Erro ao testar APIs:', apiError.message);
        }

        // 5. Simular o que o frontend deveria receber
        console.log('\n🎯 5. Simulação do que o frontend deveria processar:');
        if (scheduleData.length > 0) {
            const data = scheduleData[0];
            const formData = {
                equipment_id: data.equipment_id?.toString() || '',
                maintenance_type: data.maintenance_type || '',
                description: data.description || '',
                scheduled_date: data.scheduled_date || '',
                priority: data.priority || 'medium',
                assigned_user_id: data.assigned_user_id?.toString() || '',
                estimated_cost: data.estimated_cost?.toString() || '',
                status: data.status || 'pending',
                maintenance_plan_id: data.maintenance_plan_id?.toString() || '',
                company_id: data.company_id?.toString() || '',
                observations: data.observations || ''
            };
            
            console.log('   FormData que deveria ser preenchido:');
            Object.entries(formData).forEach(([key, value]) => {
                const isEmpty = !value || value === '';
                console.log(`   - ${key}: "${value}" ${isEmpty ? '❌ VAZIO' : '✅ OK'}`);
            });
        }

    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    } finally {
        await connection.end();
    }
}

testFrontendDataLoading().catch(console.error);