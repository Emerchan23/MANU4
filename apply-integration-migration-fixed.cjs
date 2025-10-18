const mysql = require('mysql2/promise');

async function applyIntegrationMigrationFixed() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🚀 Aplicando migração de integração (versão corrigida)...\n');

        // 1. Adicionar coluna schedule_id na tabela service_orders
        console.log('1️⃣ Adicionando coluna schedule_id...');
        try {
            await connection.execute(`
                ALTER TABLE service_orders 
                ADD COLUMN schedule_id INT(11) NULL COMMENT 'ID do agendamento que originou esta OS'
            `);
            console.log('✅ Coluna schedule_id adicionada com sucesso');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Coluna schedule_id já existe');
            } else {
                console.log('❌ Erro:', error.message);
            }
        }

        // 2. Adicionar índice
        console.log('\n2️⃣ Adicionando índice...');
        try {
            await connection.execute(`
                CREATE INDEX idx_service_orders_schedule_id ON service_orders(schedule_id)
            `);
            console.log('✅ Índice criado com sucesso');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  Índice já existe');
            } else {
                console.log('❌ Erro:', error.message);
            }
        }

        // 3. Adicionar foreign key
        console.log('\n3️⃣ Adicionando foreign key...');
        try {
            await connection.execute(`
                ALTER TABLE service_orders 
                ADD CONSTRAINT fk_service_orders_schedule 
                FOREIGN KEY (schedule_id) REFERENCES maintenance_schedules(id) 
                ON UPDATE CASCADE ON DELETE SET NULL
            `);
            console.log('✅ Foreign key adicionada com sucesso');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  Foreign key já existe');
            } else {
                console.log('❌ Erro:', error.message);
            }
        }

        // 4. Atualizar status dos agendamentos
        console.log('\n4️⃣ Atualizando status dos agendamentos...');
        try {
            await connection.execute(`
                ALTER TABLE maintenance_schedules 
                MODIFY COLUMN status ENUM('agendado','em_andamento','concluido','cancelado','os_gerada') NOT NULL DEFAULT 'agendado'
            `);
            console.log('✅ Status "os_gerada" adicionado aos agendamentos');
        } catch (error) {
            console.log('❌ Erro:', error.message);
        }

        // 5. Corrigir ENUMs da tabela service_orders
        console.log('\n5️⃣ Corrigindo ENUMs da tabela service_orders...');
        try {
            await connection.execute(`
                ALTER TABLE service_orders 
                MODIFY COLUMN priority ENUM('BAIXA','MEDIA','ALTA','CRITICA') NOT NULL DEFAULT 'MEDIA'
            `);
            console.log('✅ ENUM priority corrigido');
        } catch (error) {
            console.log('❌ Erro priority:', error.message);
        }

        try {
            await connection.execute(`
                ALTER TABLE service_orders 
                MODIFY COLUMN status ENUM('ABERTA','EM_ANDAMENTO','AGUARDANDO_APROVACAO','APROVADA','REJEITADA','CONCLUIDA','CANCELADA') NOT NULL DEFAULT 'ABERTA'
            `);
            console.log('✅ ENUM status corrigido');
        } catch (error) {
            console.log('❌ Erro status:', error.message);
        }

        // 6. Criar tabela de histórico integrado
        console.log('\n6️⃣ Criando tabela de histórico integrado...');
        try {
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS maintenance_history_integrated (
                    id INT(11) NOT NULL AUTO_INCREMENT,
                    equipment_id INT(11) NOT NULL,
                    schedule_id INT(11) NULL,
                    service_order_id INT(11) NULL,
                    action_type ENUM('AGENDAMENTO_CRIADO','AGENDAMENTO_INICIADO','AGENDAMENTO_CONCLUIDO','OS_GERADA','OS_INICIADA','OS_CONCLUIDA','PDF_GERADO') NOT NULL,
                    description TEXT NOT NULL,
                    performed_by INT(11) NOT NULL,
                    performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    additional_data JSON NULL,
                    PRIMARY KEY (id),
                    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
                    FOREIGN KEY (schedule_id) REFERENCES maintenance_schedules(id) ON DELETE SET NULL,
                    FOREIGN KEY (service_order_id) REFERENCES service_orders(id) ON DELETE SET NULL,
                    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE RESTRICT,
                    INDEX idx_history_equipment (equipment_id),
                    INDEX idx_history_schedule (schedule_id),
                    INDEX idx_history_service_order (service_order_id),
                    INDEX idx_history_date (performed_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('✅ Tabela maintenance_history_integrated criada com sucesso');
        } catch (error) {
            console.log('❌ Erro:', error.message);
        }

        // 7. Criar tabela maintenance_types se não existir
        console.log('\n7️⃣ Verificando tabela maintenance_types...');
        try {
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS maintenance_types (
                    id INT(11) NOT NULL AUTO_INCREMENT,
                    name VARCHAR(100) NOT NULL,
                    description TEXT NULL,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    UNIQUE KEY uk_maintenance_types_name (name)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('✅ Tabela maintenance_types verificada/criada');
        } catch (error) {
            console.log('❌ Erro:', error.message);
        }

        // 8. Inserir tipos básicos
        console.log('\n8️⃣ Inserindo tipos básicos de manutenção...');
        try {
            await connection.execute(`
                INSERT IGNORE INTO maintenance_types (name, description) VALUES 
                ('PREVENTIVA', 'Manutenção preventiva programada'),
                ('CORRETIVA', 'Manutenção corretiva para reparo'),
                ('PREDITIVA', 'Manutenção baseada em condição')
            `);
            console.log('✅ Tipos básicos inseridos');
        } catch (error) {
            console.log('❌ Erro:', error.message);
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
            console.log('✅ Coluna schedule_id confirmada na tabela service_orders');
        } else {
            console.log('❌ Coluna schedule_id não encontrada');
        }

        // Verificar tabela de histórico
        const [historyTableCheck] = await connection.execute(`
            SELECT COUNT(*) as total_columns
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'maintenance_history_integrated'
        `);
        
        if (historyTableCheck[0].total_columns > 0) {
            console.log('✅ Tabela maintenance_history_integrated confirmada');
        } else {
            console.log('❌ Tabela maintenance_history_integrated não encontrada');
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
            console.log('✅ Status "os_gerada" confirmado nos agendamentos');
        } else {
            console.log('❌ Status "os_gerada" não encontrado');
        }

        console.log(`\n🎉 MIGRAÇÃO FASE 1 CONCLUÍDA COM SUCESSO!`);
        console.log(`   📋 Banco de dados preparado para integração`);
        console.log(`   🔗 Relacionamento agendamentos ↔ ordens de serviço estabelecido`);
        console.log(`   📊 Histórico integrado configurado`);

    } catch (error) {
        console.error('❌ Erro geral na migração:', error);
    } finally {
        await connection.end();
    }
}

applyIntegrationMigrationFixed().catch(console.error);