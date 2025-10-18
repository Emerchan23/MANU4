const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkMaintenanceSchedulesTable() {
    let connection;
    
    try {
        console.log('🔧 Verificando tabela maintenance_schedules...');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'hospital_maintenance'
        });

        // Verificar se a tabela existe
        console.log('🔍 Verificando se a tabela maintenance_schedules existe...');
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'maintenance_schedules'
        `, [process.env.DB_NAME || 'hospital_maintenance']);
        
        if (tables.length === 0) {
            console.log('❌ Tabela maintenance_schedules não existe!');
            console.log('🔧 Criando tabela maintenance_schedules...');
            
            await connection.execute(`
                CREATE TABLE maintenance_schedules (
                    id INT(11) NOT NULL AUTO_INCREMENT,
                    equipment_id INT(11) NOT NULL,
                    maintenance_plan_id INT(11) NULL,
                    scheduled_date DATE NOT NULL,
                    priority ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
                    assigned_user_id INT(11) NULL,
                    description TEXT NULL,
                    estimated_duration INT(11) NULL COMMENT 'Duration in minutes',
                    status ENUM('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED','OVERDUE') NOT NULL DEFAULT 'SCHEDULED',
                    completion_date DATETIME NULL,
                    completion_notes TEXT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    INDEX idx_equipment_id (equipment_id),
                    INDEX idx_scheduled_date (scheduled_date),
                    INDEX idx_status (status),
                    INDEX idx_assigned_user (assigned_user_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            
            console.log('✅ Tabela maintenance_schedules criada com sucesso!');
        } else {
            console.log('✅ Tabela maintenance_schedules existe!');
        }

        // Verificar estrutura da tabela
        console.log('🔍 Verificando estrutura da tabela...');
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'maintenance_schedules'
            ORDER BY ORDINAL_POSITION
        `, [process.env.DB_NAME || 'hospital_maintenance']);
        
        console.log('\n📋 Estrutura da tabela maintenance_schedules:');
        columns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''} ${col.EXTRA || ''}`);
        });

        // Verificar dados na tabela
        console.log('\n🔍 Verificando dados na tabela...');
        const [data] = await connection.execute('SELECT COUNT(*) as total FROM maintenance_schedules');
        console.log(`📊 Total de registros: ${data[0].total}`);
        
        if (data[0].total > 0) {
            const [sample] = await connection.execute('SELECT * FROM maintenance_schedules LIMIT 3');
            console.log('\n📄 Primeiros registros:');
            sample.forEach((row, index) => {
                console.log(`  ${index + 1}. ID: ${row.id}, Equipment: ${row.equipment_id}, Date: ${row.scheduled_date}, Status: ${row.status}`);
            });
        } else {
            console.log('📝 Inserindo dados de exemplo...');
            
            // Verificar se existem equipamentos
            const [equipment] = await connection.execute('SELECT id FROM equipment LIMIT 1');
            if (equipment.length > 0) {
                const equipmentId = equipment[0].id;
                
                await connection.execute(`
                    INSERT INTO maintenance_schedules (
                        equipment_id, scheduled_date, priority, description, status
                    ) VALUES 
                    (?, CURDATE() + INTERVAL 1 DAY, 'HIGH', 'Manutenção preventiva programada', 'SCHEDULED'),
                    (?, CURDATE() + INTERVAL 7 DAY, 'MEDIUM', 'Verificação de rotina', 'SCHEDULED'),
                    (?, CURDATE() + INTERVAL 14 DAY, 'LOW', 'Limpeza geral', 'SCHEDULED')
                `, [equipmentId, equipmentId, equipmentId]);
                
                console.log('✅ Dados de exemplo inseridos!');
            } else {
                console.log('⚠️ Nenhum equipamento encontrado para criar agendamentos de exemplo');
            }
        }

        console.log('\n✅ Verificação da tabela maintenance_schedules concluída!');

    } catch (error) {
        console.error('❌ Erro ao verificar tabela maintenance_schedules:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkMaintenanceSchedulesTable();