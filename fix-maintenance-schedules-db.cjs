const mysql = require('mysql2/promise');

async function fixMaintenanceSchedulesTable() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🔧 Corrigindo tabela maintenance_schedules...');

        // 1. Verificar se o campo created_by já existe
        console.log('🔍 Verificando se o campo created_by existe...');
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'hospital_maintenance' 
            AND TABLE_NAME = 'maintenance_schedules' 
            AND COLUMN_NAME = 'created_by'
        `);

        if (columns.length === 0) {
            console.log('➕ Adicionando campo created_by...');
            await connection.execute(`
                ALTER TABLE maintenance_schedules 
                ADD COLUMN created_by INT(11) NULL COMMENT 'ID do usuário que criou o agendamento'
            `);
            console.log('✅ Campo created_by adicionado com sucesso');
        } else {
            console.log('✅ Campo created_by já existe');
        }

        // 2. Corrigir ENUM de prioridade para aceitar valores em inglês
        console.log('🔧 Corrigindo ENUM de prioridade...');
        await connection.execute(`
            ALTER TABLE maintenance_schedules 
            MODIFY COLUMN priority ENUM('baixa','media','alta','critica','low','medium','high','critical') DEFAULT 'media'
        `);
        console.log('✅ ENUM de prioridade corrigido');

        // 3. Corrigir ENUM de maintenance_type para aceitar valores em inglês
        console.log('🔧 Corrigindo ENUM de maintenance_type...');
        await connection.execute(`
            ALTER TABLE maintenance_schedules 
            MODIFY COLUMN maintenance_type ENUM('preventiva','corretiva','preditiva','Preventiva','Corretiva','Preditiva') NOT NULL DEFAULT 'preventiva'
        `);
        console.log('✅ ENUM de maintenance_type corrigido');

        // 4. Adicionar índice para created_by se não existir
        console.log('🔍 Verificando índice para created_by...');
        const [indexes] = await connection.execute(`
            SELECT INDEX_NAME 
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = 'hospital_maintenance' 
            AND TABLE_NAME = 'maintenance_schedules' 
            AND INDEX_NAME = 'idx_created_by'
        `);

        if (indexes.length === 0) {
            console.log('➕ Criando índice para created_by...');
            await connection.execute(`
                CREATE INDEX idx_created_by ON maintenance_schedules(created_by)
            `);
            console.log('✅ Índice criado com sucesso');
        } else {
            console.log('✅ Índice para created_by já existe');
        }

        // 5. Verificar estrutura final
        console.log('\n📋 ESTRUTURA FINAL DA TABELA:');
        const [finalStructure] = await connection.execute('DESCRIBE maintenance_schedules');
        console.log('=' .repeat(80));
        finalStructure.forEach(col => {
            console.log(`  ${col.Field.padEnd(25)} | ${col.Type.padEnd(30)} | ${col.Null} | ${col.Key} | ${col.Default}`);
        });

        console.log('\n✅ Correções aplicadas com sucesso!');
        console.log('🎯 A tabela maintenance_schedules agora está compatível com a API');

    } catch (error) {
        console.error('❌ Erro ao corrigir tabela:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

// Executar correções
fixMaintenanceSchedulesTable()
    .then(() => {
        console.log('\n🎉 Processo concluído com sucesso!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Erro no processo:', error);
        process.exit(1);
    });