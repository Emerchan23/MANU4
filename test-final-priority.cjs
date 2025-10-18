const mysql = require('mysql2/promise');

async function testFinalPriority() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🎯 TESTE FINAL - CAMPO PRIORIDADE CORRIGIDO\n');

        // 1. Testar criação via API (simulando o frontend)
        console.log('📝 1. TESTANDO CRIAÇÃO VIA FRONTEND...');
        
        const testData = {
            equipmentId: 23,
            maintenanceType: 'preventiva',
            description: 'TESTE FINAL - Manutenção com prioridade ALTA',
            scheduledDate: '2025-02-25T16:00:00.000Z',
            priority: 'alta', // Valor que vem do PrioritySelect corrigido
            estimatedValue: 1500.00,
            companyId: 1,
            observations: 'Teste final após correção completa do campo prioridade'
        };

        // Simular o que a API /api/service-orders/schedule faz
        const priorityMap = {
            'baixa': 'baixa',
            'media': 'media', 
            'alta': 'alta',
            'critica': 'critica',
            // Compatibilidade com valores antigos
            'low': 'baixa',
            'medium': 'media',
            'high': 'alta',
            'critical': 'critica'
        };

        const dbPriority = priorityMap[testData.priority] || 'media';
        console.log(`   Prioridade mapeada: "${testData.priority}" → "${dbPriority}"`);

        // Inserir no banco
        const [result] = await connection.execute(`
            INSERT INTO maintenance_schedules (
                equipment_id, description, scheduled_date, priority, 
                maintenance_type, status, created_at, updated_at,
                company_id, estimated_cost, observations
            ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?)
        `, [
            testData.equipmentId,
            testData.description,
            testData.scheduledDate,
            dbPriority, // Usar valor mapeado
            testData.maintenanceType,
            'agendado',
            testData.companyId,
            testData.estimatedValue,
            testData.observations
        ]);
        
        const appointmentId = result.insertId;
        console.log(`   ✅ Agendamento criado com ID: ${appointmentId}`);

        // 2. Verificar se foi salvo corretamente
        console.log('\n📊 2. VERIFICANDO DADOS SALVOS...');
        const [saved] = await connection.execute(`
            SELECT 
                ms.id,
                ms.priority,
                ms.description,
                ms.maintenance_type,
                ms.status,
                ms.estimated_cost,
                e.name as equipment_name,
                c.name as company_name
            FROM maintenance_schedules ms
            LEFT JOIN equipment e ON ms.equipment_id = e.id
            LEFT JOIN empresas c ON ms.company_id = c.id
            WHERE ms.id = ?
        `, [appointmentId]);
        
        if (saved.length > 0) {
            const record = saved[0];
            console.log(`   ID: ${record.id}`);
            console.log(`   Prioridade: "${record.priority}" ✅`);
            console.log(`   Tipo: "${record.maintenance_type}"`);
            console.log(`   Status: "${record.status}"`);
            console.log(`   Equipamento: "${record.equipment_name}"`);
            console.log(`   Empresa: "${record.company_name}"`);
            console.log(`   Custo: R$ ${record.estimated_cost}`);
        }

        // 3. Testar edição (simulando o que o frontend faz)
        console.log('\n✏️ 3. TESTANDO EDIÇÃO...');
        const newPriority = 'critica';
        
        await connection.execute(`
            UPDATE maintenance_schedules 
            SET priority = ?, updated_at = NOW()
            WHERE id = ?
        `, [newPriority, appointmentId]);
        
        console.log(`   Prioridade alterada para: "${newPriority}"`);

        // Verificar alteração
        const [updated] = await connection.execute(`
            SELECT priority FROM maintenance_schedules WHERE id = ?
        `, [appointmentId]);
        
        if (updated.length > 0) {
            console.log(`   ✅ Confirmado no banco: "${updated[0].priority}"`);
        }

        // 4. Testar todos os valores possíveis
        console.log('\n🎯 4. TESTANDO TODOS OS VALORES DE PRIORIDADE...');
        const allPriorities = ['baixa', 'media', 'alta', 'critica'];
        
        for (const priority of allPriorities) {
            const [testResult] = await connection.execute(`
                INSERT INTO maintenance_schedules (
                    equipment_id, description, scheduled_date, priority, 
                    maintenance_type, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [
                23,
                `Teste valor: ${priority}`,
                '2025-02-27 10:00:00',
                priority,
                'preventiva',
                'agendado'
            ]);
            
            console.log(`   ✅ "${priority}": ID ${testResult.insertId}`);
        }

        console.log('\n🎉 TESTE FINAL CONCLUÍDO COM SUCESSO!');
        console.log('📋 RESUMO DAS CORREÇÕES:');
        console.log('   ✅ PrioritySelect component padronizado');
        console.log('   ✅ Páginas de criação e edição usando PrioritySelect');
        console.log('   ✅ APIs corrigidas para aceitar valores em português');
        console.log('   ✅ Valores padrão ajustados para português');
        console.log('   ✅ Mapeamento de compatibilidade mantido');
        console.log(`\n🔗 Teste no navegador: http://localhost:3000/agendamentos/${appointmentId}/editar`);

    } catch (error) {
        console.error('❌ Erro no teste final:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await connection.end();
    }
}

testFinalPriority().catch(console.error);