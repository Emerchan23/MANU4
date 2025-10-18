const mysql = require('mysql2/promise');

async function debugAppointmentCreation() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🔍 DEBUGANDO CRIAÇÃO DE AGENDAMENTOS...\n');

        // 1. Verificar estrutura da tabela maintenance_schedules
        console.log('📊 1. ESTRUTURA DA TABELA maintenance_schedules:');
        const [columns] = await connection.execute(`
            DESCRIBE maintenance_schedules
        `);
        
        columns.forEach(col => {
            console.log(`   ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        // 2. Verificar dados de empresas disponíveis
        console.log('\n📊 2. EMPRESAS DISPONÍVEIS:');
        const [companies] = await connection.execute(`
            SELECT id, name FROM empresas ORDER BY id
        `);
        
        companies.forEach(company => {
            console.log(`   ID: ${company.id} - Nome: ${company.name}`);
        });

        // 3. Criar um agendamento de teste com todos os campos
        console.log('\n📝 3. CRIANDO AGENDAMENTO DE TESTE...');
        
        const testData = {
            equipment_id: 23,
            description: 'Teste completo - Manutenção preventiva do ventilador',
            scheduled_date: '2025-02-15 10:00:00',
            priority: 'alta',
            assigned_user_id: 1,
            estimated_cost: 1200.50,
            company_id: 1, // TechMed Soluções
            observations: 'Observações de teste - verificar se este campo é salvo corretamente'
        };

        console.log('📊 Dados que serão inseridos:', testData);

        const insertQuery = `
            INSERT INTO maintenance_schedules (
                equipment_id, description, scheduled_date, priority, 
                assigned_user_id, estimated_cost, company_id, observations,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const [result] = await connection.execute(insertQuery, [
            testData.equipment_id,
            testData.description,
            testData.scheduled_date,
            testData.priority,
            testData.assigned_user_id,
            testData.estimated_cost,
            testData.company_id,
            testData.observations
        ]);

        console.log(`✅ Agendamento criado com ID: ${result.insertId}`);

        // 4. Verificar se os dados foram salvos corretamente
        console.log('\n🔍 4. VERIFICANDO DADOS SALVOS:');
        const [savedData] = await connection.execute(`
            SELECT 
                id, equipment_id, description, scheduled_date, priority,
                assigned_user_id, estimated_cost, company_id, observations,
                created_at, updated_at
            FROM maintenance_schedules 
            WHERE id = ?
        `, [result.insertId]);

        if (savedData.length > 0) {
            const appointment = savedData[0];
            console.log('📊 Dados salvos no banco:');
            Object.keys(appointment).forEach(key => {
                const value = appointment[key];
                console.log(`   ${key}: ${value} (${typeof value})`);
            });

            // 5. Testar a API de busca
            console.log('\n🌐 5. TESTANDO API DE BUSCA:');
            const fetch = (await import('node-fetch')).default;
            
            try {
                const response = await fetch(`http://localhost:3000/api/maintenance-schedules/${result.insertId}`);
                const apiData = await response.json();
                
                if (apiData.success) {
                    console.log('✅ API retornou dados com sucesso:');
                    console.log('📊 Dados da API:');
                    Object.keys(apiData.data).forEach(key => {
                        const value = apiData.data[key];
                        console.log(`   ${key}: ${value} (${typeof value})`);
                    });

                    // Verificar especificamente os campos problemáticos
                    console.log('\n🔍 VERIFICAÇÃO DOS CAMPOS PROBLEMÁTICOS:');
                    console.log(`   company_id no banco: ${appointment.company_id} (${typeof appointment.company_id})`);
                    console.log(`   company_id na API: ${apiData.data.company_id} (${typeof apiData.data.company_id})`);
                    console.log(`   estimated_cost no banco: ${appointment.estimated_cost} (${typeof appointment.estimated_cost})`);
                    console.log(`   estimated_cost na API: ${apiData.data.estimated_cost} (${typeof apiData.data.estimated_cost})`);
                    console.log(`   observations no banco: ${appointment.observations} (${typeof appointment.observations})`);
                    console.log(`   observations na API: ${apiData.data.observations} (${typeof apiData.data.observations})`);

                } else {
                    console.log('❌ API retornou erro:', apiData.error);
                }
            } catch (error) {
                console.log('❌ Erro na requisição HTTP:', error.message);
            }

        } else {
            console.log('❌ Nenhum dado encontrado após inserção');
        }

        return result.insertId;

    } catch (error) {
        console.error('❌ Erro:', error.message);
        return null;
    } finally {
        await connection.end();
    }
}

debugAppointmentCreation().then(appointmentId => {
    if (appointmentId) {
        console.log(`\n🎉 DEBUG CONCLUÍDO! Agendamento criado com ID: ${appointmentId}`);
        console.log(`🔗 Teste a edição em: http://localhost:3000/agendamentos/${appointmentId}/editar`);
    } else {
        console.log('\n❌ DEBUG FALHOU!');
    }
}).catch(console.error);