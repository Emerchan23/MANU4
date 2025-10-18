const mysql = require('mysql2/promise');

async function updateMaintenanceSchedulesTable() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🔄 Adicionando campos faltantes na tabela maintenance_schedules...');

        // 1. Adicionar campo company_id
        try {
            await connection.execute(`
                ALTER TABLE maintenance_schedules 
                ADD COLUMN company_id INT(11) NULL COMMENT 'ID da empresa prestadora de serviços'
            `);
            console.log('✅ Campo company_id adicionado com sucesso');
        } catch (error) {
            if (error.message.includes('Duplicate column name')) {
                console.log('ℹ️ Campo company_id já existe');
            } else {
                throw error;
            }
        }

        // 2. Adicionar campo observations
        try {
            await connection.execute(`
                ALTER TABLE maintenance_schedules 
                ADD COLUMN observations TEXT NULL COMMENT 'Observações adicionais do agendamento'
            `);
            console.log('✅ Campo observations adicionado com sucesso');
        } catch (error) {
            if (error.message.includes('Duplicate column name')) {
                console.log('ℹ️ Campo observations já existe');
            } else {
                throw error;
            }
        }

        // 3. Adicionar índice para company_id
        try {
            await connection.execute(`
                CREATE INDEX idx_company_id ON maintenance_schedules(company_id)
            `);
            console.log('✅ Índice idx_company_id criado com sucesso');
        } catch (error) {
            if (error.message.includes('Duplicate key name')) {
                console.log('ℹ️ Índice idx_company_id já existe');
            } else {
                throw error;
            }
        }

        // 4. Verificar se a tabela companies existe
        const [companiesTable] = await connection.execute(`
            SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'hospital_maintenance' 
            AND TABLE_NAME = 'companies'
        `);

        if (companiesTable[0].count > 0) {
            // 5. Adicionar FK para company_id
            try {
                await connection.execute(`
                    ALTER TABLE maintenance_schedules 
                    ADD CONSTRAINT fk_maintenance_schedules_company 
                    FOREIGN KEY (company_id) REFERENCES companies(id) 
                    ON DELETE SET NULL ON UPDATE CASCADE
                `);
                console.log('✅ Foreign key para companies adicionada com sucesso');
            } catch (error) {
                if (error.message.includes('Duplicate foreign key constraint name')) {
                    console.log('ℹ️ Foreign key para companies já existe');
                } else {
                    console.log('⚠️ Erro ao adicionar FK para companies:', error.message);
                }
            }
        } else {
            console.log('⚠️ Tabela companies não encontrada, FK não adicionada');
        }

        // 6. Verificar estrutura final
        console.log('\n📋 Verificando campos adicionados:');
        const [columns] = await connection.execute(`
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                COLUMN_TYPE,
                IS_NULLABLE,
                COLUMN_DEFAULT,
                COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'hospital_maintenance' 
            AND TABLE_NAME = 'maintenance_schedules'
            AND COLUMN_NAME IN ('company_id', 'observations')
            ORDER BY COLUMN_NAME
        `);

        columns.forEach(col => {
            console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE} - ${col.COLUMN_COMMENT}`);
        });

        console.log('\n✅ Atualização da tabela maintenance_schedules concluída!');

    } catch (error) {
        console.error('❌ Erro ao atualizar tabela:', error.message);
    } finally {
        await connection.end();
    }
}

updateMaintenanceSchedulesTable();