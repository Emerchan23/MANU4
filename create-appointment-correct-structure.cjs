const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAppointmentWithCorrectStructure() {
    console.log('🚀 Criando agendamento com estrutura correta...');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hospital_maintenance',
        port: process.env.DB_PORT || 3306
    });
    
    try {
        console.log('✅ Conectado ao banco de dados');
        
        // Verificar dados necessários
        const [equipment] = await connection.execute('SELECT id, name FROM equipment WHERE name LIKE "%Ventilador%" LIMIT 1');
        const [users] = await connection.execute('SELECT id, name FROM users WHERE name LIKE "%Teste%" LIMIT 1');
        
        console.log('📊 Dados encontrados:');
        console.log('- Equipamentos:', equipment);
        console.log('- Usuários:', users);
        
        const equipmentId = equipment.length > 0 ? equipment[0].id : 23;
        const userId = users.length > 0 ? users[0].id : 1;
        
        // Criar agendamento com a estrutura correta da tabela
        const insertQuery = `
            INSERT INTO maintenance_schedules (
                equipment_id,
                assigned_user_id,
                scheduled_date,
                estimated_duration_hours,
                priority,
                status,
                maintenance_type,
                description,
                instructions,
                estimated_cost,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        
        const values = [
            equipmentId,                                          // equipment_id
            userId,                                              // assigned_user_id
            '2025-02-15 09:00:00',                              // scheduled_date
            4,                                                   // estimated_duration_hours
            'alta',                                              // priority
            'SCHEDULED',                                         // status
            'preventiva',                                        // maintenance_type
            'Manutenção preventiva completa do ventilador pulmonar', // description
            'Calibração de Instrumentos - Teste completo de todos os campos do formulário', // instructions
            850.00                                               // estimated_cost
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
        
        // Verificar total de agendamentos
        const [total] = await connection.execute(
            'SELECT COUNT(*) as total FROM maintenance_schedules'
        );
        
        console.log(`📊 Total de agendamentos na tabela: ${total[0].total}`);
        
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

// Executar criação
createAppointmentWithCorrectStructure()
    .then(result => {
        if (result.success) {
            console.log('🎉 SUCESSO TOTAL! Agendamento criado automaticamente!');
            console.log('📊 Dados completos do agendamento:', JSON.stringify(result.data, null, 2));
        } else {
            console.log('❌ FALHA na criação do agendamento:', result.error);
        }
    })
    .catch(console.error);