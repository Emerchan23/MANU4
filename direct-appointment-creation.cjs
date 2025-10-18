const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAppointmentDirectly() {
    console.log('🚀 Criando agendamento diretamente no banco de dados...');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hospital_maintenance',
        port: process.env.DB_PORT || 3306
    });
    
    try {
        console.log('✅ Conectado ao banco de dados');
        
        // Verificar se as tabelas necessárias existem
        const [companies] = await connection.execute('SELECT id, name FROM empresas WHERE name LIKE "%TechMed%" LIMIT 1');
        const [equipment] = await connection.execute('SELECT id, name FROM equipment WHERE name LIKE "%Ventilador%" LIMIT 1');
        const [users] = await connection.execute('SELECT id, name FROM users WHERE name LIKE "%Teste%" LIMIT 1');
        
        console.log('📊 Dados encontrados:');
        console.log('- Empresas:', companies);
        console.log('- Equipamentos:', equipment);
        console.log('- Usuários:', users);
        
        const companyId = companies.length > 0 ? companies[0].id : 1;
        const equipmentId = equipment.length > 0 ? equipment[0].id : 1;
        const userId = users.length > 0 ? users[0].id : 1;
        
        // Criar agendamento na tabela maintenance_schedules
        const insertQuery = `
            INSERT INTO maintenance_schedules (
                equipment_id,
                company_id,
                maintenance_type,
                template_name,
                service_description,
                scheduled_date,
                priority,
                estimated_cost,
                responsible_user_id,
                recurrence_type,
                recurrence_interval,
                observations,
                status,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        
        const values = [
            equipmentId,                                          // equipment_id
            companyId,                                           // company_id
            'PREVENTIVA',                                        // maintenance_type
            'Calibração de Instrumentos',                        // template_name
            'Manutenção preventiva completa do ventilador pulmonar', // service_description
            '2025-02-15',                                        // scheduled_date
            'ALTA',                                              // priority
            850.00,                                              // estimated_cost
            userId,                                              // responsible_user_id
            'SEMANAL',                                           // recurrence_type
            1,                                                   // recurrence_interval
            'Teste completo de todos os campos do formulário',   // observations
            'AGENDADO'                                           // status
        ];
        
        console.log('📝 Inserindo agendamento...');
        const [result] = await connection.execute(insertQuery, values);
        
        console.log('✅ Agendamento criado com sucesso!');
        console.log('📋 ID do agendamento:', result.insertId);
        
        // Verificar se foi criado
        const [verification] = await connection.execute(
            'SELECT * FROM maintenance_schedules WHERE id = ?',
            [result.insertId]
        );
        
        console.log('🔍 Verificação do agendamento criado:');
        console.log(verification[0]);
        
        return {
            success: true,
            appointmentId: result.insertId,
            data: verification[0]
        };
        
    } catch (error) {
        console.error('❌ Erro ao criar agendamento:', error);
        return {
            success: false,
            error: error.message
        };
    } finally {
        await connection.end();
        console.log('🔌 Conexão com banco fechada');
    }
}

// Executar criação direta
createAppointmentDirectly()
    .then(result => {
        if (result.success) {
            console.log('🎉 SUCESSO! Agendamento criado automaticamente!');
            console.log('📊 Dados do agendamento:', result.data);
        } else {
            console.log('❌ FALHA na criação do agendamento:', result.error);
        }
    })
    .catch(console.error);