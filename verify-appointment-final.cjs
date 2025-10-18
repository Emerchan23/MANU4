const mysql = require('mysql2/promise');

async function verifyAppointmentCreated() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🔍 Verificando se o agendamento foi criado...');

        // Verificar os últimos 5 registros na tabela maintenance_schedules (usando colunas corretas)
        const [schedules] = await connection.execute(`
            SELECT 
                ms.id,
                ms.equipment_id,
                eq.name as equipamento_nome,
                ms.maintenance_type,
                ms.scheduled_date,
                ms.priority,
                ms.estimated_cost,
                ms.assigned_user_id,
                ms.description,
                ms.instructions,
                ms.completion_notes,
                ms.created_at
            FROM maintenance_schedules ms
            LEFT JOIN equipment eq ON ms.equipment_id = eq.id
            ORDER BY ms.created_at DESC
            LIMIT 5
        `);

        console.log(`📊 Total de agendamentos encontrados: ${schedules.length}`);

        if (schedules.length === 0) {
            console.log('❌ Nenhum agendamento encontrado na tabela maintenance_schedules');
            return false;
        }

        // Verificar se existe um agendamento de teste recente
        const testAppointment = schedules.find(schedule => 
            schedule.description?.toLowerCase().includes('ventilador') ||
            schedule.description?.toLowerCase().includes('preventiva') ||
            schedule.equipamento_nome?.toLowerCase().includes('ventilador') ||
            schedule.instructions?.toLowerCase().includes('teste') ||
            schedule.completion_notes?.toLowerCase().includes('teste')
        );

        if (testAppointment) {
            console.log('🎉 AGENDAMENTO DE TESTE ENCONTRADO!');
            console.log('📋 Detalhes do agendamento:');
            console.log(`   ID: ${testAppointment.id}`);
            console.log(`   Equipamento: ${testAppointment.equipamento_nome} (ID: ${testAppointment.equipment_id})`);
            console.log(`   Tipo: ${testAppointment.maintenance_type}`);
            console.log(`   Data Agendada: ${testAppointment.scheduled_date}`);
            console.log(`   Prioridade: ${testAppointment.priority}`);
            console.log(`   Custo Estimado: R$ ${testAppointment.estimated_cost}`);
            console.log(`   Responsável: ${testAppointment.assigned_user_id}`);
            console.log(`   Descrição: ${testAppointment.description}`);
            console.log(`   Instruções: ${testAppointment.instructions}`);
            console.log(`   Criado em: ${testAppointment.created_at}`);
            return true;
        } else {
            console.log('⚠️ Agendamento de teste não encontrado');
            console.log('📋 Últimos agendamentos encontrados:');
            schedules.forEach((schedule, index) => {
                console.log(`\n   ${index + 1}. ID: ${schedule.id}`);
                console.log(`      Equipamento: ${schedule.equipamento_nome}`);
                console.log(`      Tipo: ${schedule.maintenance_type}`);
                console.log(`      Data: ${schedule.scheduled_date}`);
                console.log(`      Criado: ${schedule.created_at}`);
            });
            return false;
        }

    } catch (error) {
        console.error('❌ Erro ao verificar agendamento:', error.message);
        return false;
    } finally {
        await connection.end();
    }
}

// Executar verificação a cada 3 segundos por 30 segundos
let attempts = 0;
const maxAttempts = 10;

async function checkPeriodically() {
    attempts++;
    console.log(`\n🔄 Tentativa ${attempts}/${maxAttempts} - Verificando agendamento...`);
    
    const found = await verifyAppointmentCreated();
    
    if (found) {
        console.log('\n✅ SUCESSO! Agendamento criado e verificado no banco de dados!');
        process.exit(0);
    } else if (attempts >= maxAttempts) {
        console.log('\n❌ Tempo limite atingido. Agendamento não foi encontrado.');
        process.exit(1);
    } else {
        console.log(`⏳ Aguardando 3 segundos para próxima verificação...`);
        setTimeout(checkPeriodically, 3000);
    }
}

console.log('🚀 Iniciando verificação periódica do agendamento...');
checkPeriodically();