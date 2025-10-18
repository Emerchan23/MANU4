const mysql = require('mysql2/promise');

async function testPriorityCreation() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🔧 TESTANDO CRIAÇÃO DE AGENDAMENTO VIA FRONTEND...\n');

        // Simular dados que o frontend enviaria
        const formData = {
            equipment_id: 23,
            description: 'Teste criação via frontend - Manutenção preventiva',
            scheduled_date: '2025-02-25T14:30:00.000Z',
            priority: 'media', // valor que vem do PrioritySelect
            maintenance_type: 'preventiva',
            status: 'agendado',
            company_id: 1,
            estimated_cost: 850.75,
            observations: 'Teste de criação com prioridade "media" via frontend'
        };

        console.log('📝 1. DADOS DO FORMULÁRIO:');
        console.log(`   Prioridade: "${formData.priority}"`);
        console.log(`   Equipamento ID: ${formData.equipment_id}`);
        console.log(`   Empresa ID: ${formData.company_id}`);
        console.log(`   Custo: R$ ${formData.estimated_cost}`);

        // Inserir como a API faria
        const [result] = await connection.execute(`
            INSERT INTO maintenance_schedules (
                equipment_id, description, scheduled_date, priority, 
                maintenance_type, status, created_at, updated_at,
                company_id, estimated_cost, observations
            ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?)
        `, [
            formData.equipment_id,
            formData.description,
            formData.scheduled_date,
            formData.priority,
            formData.maintenance_type,
            formData.status,
            formData.company_id,
            formData.estimated_cost,
            formData.observations
        ]);
        
        const appointmentId = result.insertId;
        console.log(`\n✅ Agendamento criado com ID: ${appointmentId}`);

        // Verificar se foi salvo corretamente
        const [saved] = await connection.execute(`
            SELECT 
                ms.id,
                ms.priority,
                ms.description,
                ms.company_id,
                ms.estimated_cost,
                ms.observations,
                e.name as equipment_name,
                c.name as company_name
            FROM maintenance_schedules ms
            LEFT JOIN equipment e ON ms.equipment_id = e.id
            LEFT JOIN empresas c ON ms.company_id = c.id
            WHERE ms.id = ?
        `, [appointmentId]);
        
        if (saved.length > 0) {
            const record = saved[0];
            console.log('\n📊 2. DADOS SALVOS NO BANCO:');
            console.log(`   ID: ${record.id}`);
            console.log(`   Prioridade: "${record.priority}"`);
            console.log(`   Equipamento: "${record.equipment_name}"`);
            console.log(`   Empresa: "${record.company_name}"`);
            console.log(`   Custo: R$ ${record.estimated_cost}`);
            console.log(`   Observações: "${record.observations}"`);
        }

        // Testar todos os valores de prioridade do PrioritySelect
        console.log('\n🎯 3. TESTANDO TODOS OS VALORES DO PRIORITYSELECT...');
        const priorityValues = ['baixa', 'media', 'alta', 'critica'];
        
        for (const priority of priorityValues) {
            const [testResult] = await connection.execute(`
                INSERT INTO maintenance_schedules (
                    equipment_id, description, scheduled_date, priority, 
                    maintenance_type, status, created_at, updated_at,
                    company_id, estimated_cost
                ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)
            `, [
                23,
                `Teste PrioritySelect: ${priority}`,
                '2025-02-26 15:00:00',
                priority,
                'preventiva',
                'agendado',
                1,
                500.00
            ]);
            
            console.log(`   ✅ Prioridade "${priority}": ID ${testResult.insertId}`);
        }

        console.log('\n🎉 TESTE DE CRIAÇÃO CONCLUÍDO!');
        console.log(`🔗 Teste a edição em: http://localhost:3000/agendamentos/${appointmentId}/editar`);
        console.log(`🔗 Criar novo em: http://localhost:3000/agendamentos/novo`);

    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await connection.end();
    }
}

testPriorityCreation().catch(console.error);