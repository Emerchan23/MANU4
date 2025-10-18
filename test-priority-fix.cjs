const mysql = require('mysql2/promise');

async function testPriorityFix() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🔧 TESTANDO CORREÇÃO DO CAMPO PRIORIDADE...\n');

        // 1. Criar um novo agendamento com prioridade "alta"
        console.log('📝 1. CRIANDO AGENDAMENTO COM PRIORIDADE "ALTA"...');
        const [result] = await connection.execute(`
            INSERT INTO maintenance_schedules (
                equipment_id, description, scheduled_date, priority, 
                maintenance_type, status, created_at, updated_at,
                company_id, estimated_cost, observations
            ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?)
        `, [
            23, // equipment_id
            'Teste correção prioridade - Manutenção preventiva completa',
            '2025-02-25 14:30:00',
            'alta', // prioridade alta
            'preventiva',
            'agendado',
            1, // company_id
            1250.50, // estimated_cost
            'Teste após correção do mapeamento de prioridade entre frontend e backend'
        ]);
        
        const appointmentId = result.insertId;
        console.log(`✅ Agendamento criado com ID: ${appointmentId}`);

        // 2. Verificar se foi salvo corretamente
        console.log('\n📊 2. VERIFICANDO DADOS SALVOS...');
        const [saved] = await connection.execute(`
            SELECT id, priority, description, company_id, estimated_cost, observations
            FROM maintenance_schedules 
            WHERE id = ?
        `, [appointmentId]);
        
        if (saved.length > 0) {
            const record = saved[0];
            console.log(`   ID: ${record.id}`);
            console.log(`   Prioridade: "${record.priority}" (${typeof record.priority})`);
            console.log(`   Empresa ID: ${record.company_id}`);
            console.log(`   Custo: R$ ${record.estimated_cost}`);
            console.log(`   Observações: "${record.observations}"`);
        }

        // 3. Testar recuperação via API (simulando o que o frontend faz)
        console.log('\n🔍 3. TESTANDO RECUPERAÇÃO VIA API...');
        
        // Simular a query da API GET /api/maintenance-schedules/[id]
        const [apiResult] = await connection.execute(`
            SELECT 
                ms.id,
                ms.equipment_id,
                ms.description,
                ms.scheduled_date,
                ms.priority,
                ms.maintenance_type,
                ms.status,
                ms.assigned_user_id,
                ms.estimated_cost,
                ms.company_id,
                ms.observations,
                e.name as equipment_name,
                e.model as equipment_model,
                e.patrimonio_number as equipment_patrimonio_number,
                c.name as company_name,
                u.name as user_name
            FROM maintenance_schedules ms
            LEFT JOIN equipment e ON ms.equipment_id = e.id
            LEFT JOIN empresas c ON ms.company_id = c.id
            LEFT JOIN users u ON ms.assigned_user_id = u.id
            WHERE ms.id = ?
        `, [appointmentId]);

        if (apiResult.length > 0) {
            const apiData = apiResult[0];
            console.log('   ✅ Dados recuperados via API:');
            console.log(`      Prioridade: "${apiData.priority}"`);
            console.log(`      Empresa: "${apiData.company_name}" (ID: ${apiData.company_id})`);
            console.log(`      Custo: R$ ${apiData.estimated_cost}`);
            console.log(`      Observações: "${apiData.observations}"`);
        }

        // 4. Testar diferentes valores de prioridade
        console.log('\n🎯 4. TESTANDO DIFERENTES VALORES DE PRIORIDADE...');
        const testPriorities = ['baixa', 'media', 'alta', 'critica'];
        
        for (const priority of testPriorities) {
            const [testResult] = await connection.execute(`
                INSERT INTO maintenance_schedules (
                    equipment_id, description, scheduled_date, priority, 
                    maintenance_type, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [
                23,
                `Teste prioridade: ${priority}`,
                '2025-02-26 10:00:00',
                priority,
                'preventiva',
                'agendado'
            ]);
            
            console.log(`   ✅ "${priority}": ID ${testResult.insertId}`);
        }

        console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
        console.log(`🔗 Teste a edição em: http://localhost:3000/agendamentos/${appointmentId}/editar`);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await connection.end();
    }
}

testPriorityFix().catch(console.error);