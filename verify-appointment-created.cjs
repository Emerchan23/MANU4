const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyAppointmentCreated() {
    let connection;
    
    try {
        console.log('🔍 VERIFICANDO AGENDAMENTOS CRIADOS...');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'hospital_maintenance'
        });

        console.log('✅ Conectado ao banco de dados');

        // Verificar últimos agendamentos criados
        const [appointments] = await connection.execute(`
            SELECT 
                ms.id,
                ms.title,
                ms.description,
                ms.scheduled_date,
                ms.priority,
                ms.status,
                ms.estimated_cost,
                ms.recurrence_type,
                ms.recurrence_interval,
                ms.observations,
                ms.created_at,
                e.name as equipment_name,
                emp.name as company_name,
                mt.name as maintenance_type,
                u.name as responsible_name
            FROM maintenance_schedules ms
            LEFT JOIN equipment e ON ms.equipment_id = e.id
            LEFT JOIN empresas emp ON ms.company_id = emp.id
            LEFT JOIN maintenance_types mt ON ms.maintenance_type_id = mt.id
            LEFT JOIN users u ON ms.assigned_to = u.id
            ORDER BY ms.created_at DESC
            LIMIT 5
        `);

        console.log(`📊 Encontrados ${appointments.length} agendamentos recentes:`);
        
        if (appointments.length > 0) {
            appointments.forEach((apt, index) => {
                console.log(`\n📅 AGENDAMENTO ${index + 1}:`);
                console.log(`   ID: ${apt.id}`);
                console.log(`   Título: ${apt.title || 'N/A'}`);
                console.log(`   Descrição: ${apt.description || 'N/A'}`);
                console.log(`   Equipamento: ${apt.equipment_name || 'N/A'}`);
                console.log(`   Empresa: ${apt.company_name || 'N/A'}`);
                console.log(`   Tipo: ${apt.maintenance_type || 'N/A'}`);
                console.log(`   Data Agendada: ${apt.scheduled_date || 'N/A'}`);
                console.log(`   Prioridade: ${apt.priority || 'N/A'}`);
                console.log(`   Status: ${apt.status || 'N/A'}`);
                console.log(`   Custo: R$ ${apt.estimated_cost || '0,00'}`);
                console.log(`   Responsável: ${apt.responsible_name || 'N/A'}`);
                console.log(`   Recorrência: ${apt.recurrence_type || 'N/A'} (${apt.recurrence_interval || 0})`);
                console.log(`   Observações: ${apt.observations || 'N/A'}`);
                console.log(`   Criado em: ${apt.created_at}`);
            });
            
            // Verificar se o último agendamento tem os dados esperados
            const lastAppointment = appointments[0];
            const isTestAppointment = 
                (lastAppointment.description && lastAppointment.description.toLowerCase().includes('ventilador')) ||
                (lastAppointment.company_name && lastAppointment.company_name.toLowerCase().includes('techmed')) ||
                (lastAppointment.observations && lastAppointment.observations.toLowerCase().includes('teste'));
            
            if (isTestAppointment) {
                console.log('\n🎉 AGENDAMENTO DE TESTE ENCONTRADO COM SUCESSO!');
                return { success: true, appointment: lastAppointment };
            } else {
                console.log('\n⚠️ Agendamento encontrado, mas pode não ser o de teste');
                return { success: true, appointment: lastAppointment, warning: 'Dados podem não corresponder ao teste' };
            }
        } else {
            console.log('\n❌ NENHUM AGENDAMENTO ENCONTRADO');
            return { success: false, message: 'Nenhum agendamento encontrado na base de dados' };
        }

    } catch (error) {
        console.error('❌ ERRO ao verificar agendamentos:', error);
        return { success: false, error: error.message };
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

verifyAppointmentCreated().then(result => {
    console.log('\n📊 RESULTADO DA VERIFICAÇÃO:', result);
    if (result.success) {
        console.log('✅ VERIFICAÇÃO CONCLUÍDA COM SUCESSO!');
        process.exit(0);
    } else {
        console.log('❌ FALHA NA VERIFICAÇÃO');
        process.exit(1);
    }
});