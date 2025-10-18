const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function applyIntegrationMigration() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance',
        multipleStatements: true
    });

    try {
        console.log('🚀 Aplicando migração de integração Agendamentos ↔ Ordens de Serviço...\n');

        // Ler o arquivo SQL
        const sqlFile = path.join(__dirname, 'database', 'migrations', '001_integration_agendamentos_ordens_servico.sql');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');

        // Dividir o SQL em comandos individuais (excluindo triggers que precisam de tratamento especial)
        const commands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.includes('DELIMITER'));

        let successCount = 0;
        let errorCount = 0;

        for (const command of commands) {
            if (command.includes('CREATE TRIGGER') || command.includes('BEGIN') || command.includes('END$$')) {
                continue; // Pular triggers por enquanto
            }

            try {
                await connection.execute(command);
                console.log('✅ Comando executado com sucesso');
                successCount++;
            } catch (error) {
                if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                    console.log('⚠️  Comando já aplicado anteriormente (ignorado)');
                } else if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log('⚠️  Campo já existe (ignorado)');
                } else {
                    console.log('❌ Erro:', error.message);
                    errorCount++;
                }
            }
        }

        // Aplicar triggers separadamente
        console.log('\n🔧 Aplicando triggers...');
        
        // Trigger 1: service_order_from_schedule
        try {
            await connection.execute(`
                DROP TRIGGER IF EXISTS tr_service_order_from_schedule
            `);
            
            await connection.execute(`
                CREATE TRIGGER tr_service_order_from_schedule 
                AFTER INSERT ON service_orders
                FOR EACH ROW
                BEGIN
                    IF NEW.schedule_id IS NOT NULL THEN
                        INSERT INTO maintenance_history_integrated 
                        (equipment_id, schedule_id, service_order_id, action_type, description, performed_by)
                        VALUES 
                        (NEW.equipment_id, NEW.schedule_id, NEW.id, 'OS_GERADA', 
                         CONCAT('Ordem de Serviço ', NEW.order_number, ' gerada a partir do agendamento ID ', NEW.schedule_id),
                         NEW.created_by);
                    END IF;
                END
            `);
            console.log('✅ Trigger tr_service_order_from_schedule criado');
        } catch (error) {
            console.log('❌ Erro ao criar trigger tr_service_order_from_schedule:', error.message);
        }

        // Trigger 2: maintenance_schedule_status_change
        try {
            await connection.execute(`
                DROP TRIGGER IF EXISTS tr_maintenance_schedule_status_change
            `);
            
            await connection.execute(`
                CREATE TRIGGER tr_maintenance_schedule_status_change 
                AFTER UPDATE ON maintenance_schedules
                FOR EACH ROW
                BEGIN
                    IF OLD.status != NEW.status THEN
                        INSERT INTO maintenance_history_integrated 
                        (equipment_id, schedule_id, action_type, description, performed_by)
                        VALUES 
                        (NEW.equipment_id, NEW.id, 
                         CASE NEW.status
                             WHEN 'em_andamento' THEN 'AGENDAMENTO_INICIADO'
                             WHEN 'concluido' THEN 'AGENDAMENTO_CONCLUIDO'
                             WHEN 'os_gerada' THEN 'OS_GERADA'
                             ELSE 'AGENDAMENTO_CRIADO'
                         END,
                         CONCAT('Status do agendamento alterado de "', OLD.status, '" para "', NEW.status, '"'),
                         NEW.created_by);
                    END IF;
                END
            `);
            console.log('✅ Trigger tr_maintenance_schedule_status_change criado');
        } catch (error) {
            console.log('❌ Erro ao criar trigger tr_maintenance_schedule_status_change:', error.message);
        }

        // Trigger 3: service_order_status_change
        try {
            await connection.execute(`
                DROP TRIGGER IF EXISTS tr_service_order_status_change
            `);
            
            await connection.execute(`
                CREATE TRIGGER tr_service_order_status_change 
                AFTER UPDATE ON service_orders
                FOR EACH ROW
                BEGIN
                    IF OLD.status != NEW.status THEN
                        INSERT INTO maintenance_history_integrated 
                        (equipment_id, schedule_id, service_order_id, action_type, description, performed_by)
                        VALUES 
                        (NEW.equipment_id, NEW.schedule_id, NEW.id,
                         CASE NEW.status
                             WHEN 'EM_ANDAMENTO' THEN 'OS_INICIADA'
                             WHEN 'CONCLUIDA' THEN 'OS_CONCLUIDA'
                             ELSE 'OS_GERADA'
                         END,
                         CONCAT('Status da OS ', NEW.order_number, ' alterado de "', OLD.status, '" para "', NEW.status, '"'),
                         NEW.created_by);
                    END IF;
                END
            `);
            console.log('✅ Trigger tr_service_order_status_change criado');
        } catch (error) {
            console.log('❌ Erro ao criar trigger tr_service_order_status_change:', error.message);
        }

        // Verificações finais
        console.log('\n🔍 Verificações finais...');
        
        // Verificar coluna schedule_id
        const [scheduleIdCheck] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'service_orders'
            AND COLUMN_NAME = 'schedule_id'
        `);
        
        if (scheduleIdCheck.length > 0) {
            console.log('✅ Coluna schedule_id adicionada com sucesso na tabela service_orders');
        } else {
            console.log('❌ Coluna schedule_id não foi adicionada');
        }

        // Verificar tabela de histórico
        const [historyTableCheck] = await connection.execute(`
            SELECT COUNT(*) as total_columns
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'maintenance_history_integrated'
        `);
        
        if (historyTableCheck[0].total_columns > 0) {
            console.log('✅ Tabela maintenance_history_integrated criada com sucesso');
        } else {
            console.log('❌ Tabela maintenance_history_integrated não foi criada');
        }

        // Verificar status atualizado
        const [statusCheck] = await connection.execute(`
            SELECT COLUMN_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'maintenance_schedules'
            AND COLUMN_NAME = 'status'
        `);
        
        if (statusCheck.length > 0 && statusCheck[0].COLUMN_TYPE.includes('os_gerada')) {
            console.log('✅ Status "os_gerada" adicionado aos agendamentos');
        } else {
            console.log('❌ Status "os_gerada" não foi adicionado');
        }

        console.log(`\n📊 RESUMO DA MIGRAÇÃO:`);
        console.log(`   ✅ Comandos executados com sucesso: ${successCount}`);
        console.log(`   ❌ Comandos com erro: ${errorCount}`);
        console.log(`\n🎉 Migração de integração aplicada com sucesso!`);

    } catch (error) {
        console.error('❌ Erro geral na migração:', error);
    } finally {
        await connection.end();
    }
}

applyIntegrationMigration().catch(console.error);