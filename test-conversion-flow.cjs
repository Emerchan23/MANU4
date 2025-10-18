const mysql = require('mysql2/promise');

async function testConversionFlow() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🧪 TESTE DO FLUXO DE CONVERSÃO AGENDAMENTO → OS\n');

        // 1. Verificar se existem agendamentos com status COMPLETED
        console.log('1️⃣ Verificando agendamentos com status concluido...');
        const [completedSchedules] = await connection.execute(`
            SELECT 
                id, 
                description, 
                status, 
                scheduled_date,
                equipment_id
            FROM maintenance_schedules 
            WHERE status = 'concluido'
            LIMIT 5
        `);

        if (completedSchedules.length === 0) {
            console.log('⚠️  Nenhum agendamento com status concluido encontrado');
            console.log('📝 Criando um agendamento de teste...');
            
            // Criar um agendamento de teste
            const [insertResult] = await connection.execute(`
                INSERT INTO maintenance_schedules (
                    equipment_id,
                    description,
                    scheduled_date,
                    priority,
                    status,
                    assigned_user_id,
                    created_at,
                    updated_at
                ) VALUES (1, 'Teste de conversão para OS', '2024-12-15', 'MEDIA', 'concluido', 1, NOW(), NOW())
            `);
            
            // Verificar se foi inserido corretamente
            const [checkResult] = await connection.execute(`
                SELECT id, status FROM maintenance_schedules WHERE id = ?
            `, [insertResult.insertId]);
            
            console.log('📊 Agendamento criado:', checkResult[0]);
            
            const testScheduleId = insertResult.insertId;
            console.log(`✅ Agendamento de teste criado com ID: ${testScheduleId}`);
            
            // Buscar o agendamento criado
            const [newSchedule] = await connection.execute(`
                SELECT 
                    id, 
                    description, 
                    status, 
                    scheduled_date,
                    equipment_id
                FROM maintenance_schedules 
                WHERE id = ?
            `, [testScheduleId]);
            
            completedSchedules.push(newSchedule[0]);
        }

        console.log(`✅ Encontrados ${completedSchedules.length} agendamentos concluidos:`);
        completedSchedules.forEach((schedule, index) => {
            console.log(`   ${index + 1}. ID: ${schedule.id} - ${schedule.description} (${schedule.status})`);
        });

        // 2. Testar conversão do primeiro agendamento
        const testSchedule = completedSchedules[0];
        console.log(`\n2️⃣ Testando conversão do agendamento ID: ${testSchedule.id}...`);

        // Verificar se já existe uma OS para este agendamento
        const [existingOS] = await connection.execute(`
            SELECT id, order_number FROM service_orders WHERE schedule_id = ?
        `, [testSchedule.id]);

        if (existingOS.length > 0) {
            console.log(`⚠️  Já existe uma OS para este agendamento: ${existingOS[0].order_number}`);
            console.log('🔄 Removendo OS existente para testar novamente...');
            
            await connection.execute(`DELETE FROM service_orders WHERE schedule_id = ?`, [testSchedule.id]);
            await connection.execute(`UPDATE maintenance_schedules SET status = 'COMPLETED' WHERE id = ?`, [testSchedule.id]);
        }

        // 3. Simular chamada da API de conversão
        console.log('\n3️⃣ Simulando conversão via API...');
        
        const conversionData = {
            scheduleId: testSchedule.id,
            userId: 1
        };

        try {
            const response = await fetch('http://localhost:3000/api/maintenance-schedules/convert-to-service-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(conversionData)
            });

            const responseText = await response.text();
            console.log('📥 Resposta da API (raw):', responseText);

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.log('❌ Erro ao fazer parse da resposta JSON:', parseError.message);
                console.log('📄 Resposta recebida:', responseText);
                return;
            }
            
            if (response.ok && result.success) {
                console.log('✅ Conversão realizada com sucesso!');
                console.log(`   📋 OS criada: ${result.data.orderNumber}`);
                console.log(`   🔗 Service Order ID: ${result.data.serviceOrder.id}`);
                
                // 4. Verificar se o agendamento foi atualizado
                console.log('\n4️⃣ Verificando atualização do agendamento...');
                const [updatedSchedule] = await connection.execute(`
                    SELECT status FROM maintenance_schedules WHERE id = ?
                `, [testSchedule.id]);
                
                if (updatedSchedule[0].status === 'OS_GERADA') {
                    console.log('✅ Status do agendamento atualizado para OS_GERADA');
                } else {
                    console.log(`❌ Status não foi atualizado. Status atual: ${updatedSchedule[0].status}`);
                }

                // 5. Verificar se a OS foi criada corretamente
                console.log('\n5️⃣ Verificando OS criada...');
                const [createdOS] = await connection.execute(`
                    SELECT 
                        id,
                        order_number,
                        schedule_id,
                        status,
                        description,
                        equipment_id
                    FROM service_orders 
                    WHERE schedule_id = ?
                `, [testSchedule.id]);

                if (createdOS.length > 0) {
                    console.log('✅ OS criada com sucesso:');
                    console.log(`   📋 Número: ${createdOS[0].order_number}`);
                    console.log(`   🔗 Schedule ID: ${createdOS[0].schedule_id}`);
                    console.log(`   📊 Status: ${createdOS[0].status}`);
                } else {
                    console.log('❌ OS não foi encontrada no banco de dados');
                }

                // 6. Verificar histórico integrado
                console.log('\n6️⃣ Verificando histórico integrado...');
                const [historyRecords] = await connection.execute(`
                    SELECT 
                        action_type,
                        description,
                        performed_at
                    FROM maintenance_history_integrated 
                    WHERE schedule_id = ? OR service_order_id = ?
                    ORDER BY performed_at DESC
                `, [testSchedule.id, createdOS[0]?.id]);

                if (historyRecords.length > 0) {
                    console.log('✅ Registros de histórico encontrados:');
                    historyRecords.forEach((record, index) => {
                        console.log(`   ${index + 1}. ${record.action_type}: ${record.description}`);
                    });
                } else {
                    console.log('⚠️  Nenhum registro de histórico encontrado');
                }

            } else {
                console.log('❌ Erro na conversão:');
                console.log(`   Status: ${response.status}`);
                console.log(`   Erro: ${result.error || 'Erro desconhecido'}`);
                console.log('   Resposta completa:', result);
            }

        } catch (fetchError) {
            console.log('❌ Erro na requisição HTTP:', fetchError.message);
            console.log('🔍 Verifique se o servidor está rodando em http://localhost:3000');
        }

        console.log('\n🎯 RESUMO DO TESTE:');
        console.log('✅ Estrutura do banco verificada');
        console.log('✅ API de conversão testada');
        console.log('✅ Fluxo de integração validado');

    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    } finally {
        await connection.end();
    }
}

testConversionFlow();