const mysql = require('mysql2/promise');

async function debugPriorityField() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🔍 DEBUGANDO CAMPO PRIORIDADE...\n');

        // 1. Verificar estrutura do campo prioridade na tabela maintenance_schedules
        console.log('📊 1. ESTRUTURA DO CAMPO PRIORIDADE:');
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'hospital_maintenance' 
            AND TABLE_NAME = 'maintenance_schedules' 
            AND COLUMN_NAME = 'priority'
        `);
        
        if (columns.length > 0) {
            const col = columns[0];
            console.log(`   Campo: ${col.COLUMN_NAME}`);
            console.log(`   Tipo: ${col.DATA_TYPE}`);
            console.log(`   Definição: ${col.COLUMN_TYPE}`);
            console.log(`   Permite NULL: ${col.IS_NULLABLE}`);
            console.log(`   Valor padrão: ${col.COLUMN_DEFAULT}`);
        } else {
            console.log('   ❌ Campo prioridade não encontrado na tabela maintenance_schedules');
        }

        // 2. Verificar valores únicos de prioridade existentes
        console.log('\n📊 2. VALORES DE PRIORIDADE EXISTENTES:');
        const [priorities] = await connection.execute(`
            SELECT priority, COUNT(*) as count 
            FROM maintenance_schedules 
            WHERE priority IS NOT NULL 
            GROUP BY priority 
            ORDER BY count DESC
        `);
        
        if (priorities.length > 0) {
            priorities.forEach(p => {
                console.log(`   "${p.priority}": ${p.count} registros`);
            });
        } else {
            console.log('   ❌ Nenhum valor de prioridade encontrado');
        }

        // 3. Verificar últimos agendamentos criados
        console.log('\n📊 3. ÚLTIMOS AGENDAMENTOS E SUAS PRIORIDADES:');
        const [recent] = await connection.execute(`
            SELECT id, priority, description, created_at 
            FROM maintenance_schedules 
            ORDER BY id DESC 
            LIMIT 5
        `);
        
        recent.forEach(r => {
            console.log(`   ID ${r.id}: prioridade="${r.priority}" (${typeof r.priority}) - ${r.description?.substring(0, 50)}...`);
        });

        // 4. Testar inserção com diferentes valores de prioridade
        console.log('\n📝 4. TESTANDO INSERÇÃO COM DIFERENTES PRIORIDADES:');
        
        const testPriorities = ['baixa', 'media', 'alta', 'critica', 'low', 'medium', 'high', 'critical'];
        
        for (const priority of testPriorities) {
            try {
                const [result] = await connection.execute(`
                    INSERT INTO maintenance_schedules (
                        equipment_id, description, scheduled_date, priority, 
                        maintenance_type, status, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
                `, [
                    23, // equipment_id
                    `Teste prioridade: ${priority}`,
                    '2025-02-20 10:00:00',
                    priority,
                    'preventiva',
                    'agendado'
                ]);
                
                console.log(`   ✅ "${priority}": inserido com ID ${result.insertId}`);
                
                // Verificar se foi salvo corretamente
                const [check] = await connection.execute(`
                    SELECT priority FROM maintenance_schedules WHERE id = ?
                `, [result.insertId]);
                
                if (check.length > 0) {
                    console.log(`      Salvo como: "${check[0].priority}"`);
                }
                
            } catch (error) {
                console.log(`   ❌ "${priority}": ERRO - ${error.message}`);
            }
        }

        // 5. Verificar se há diferenças entre as tabelas
        console.log('\n📊 5. COMPARANDO COM TABELA SERVICE_ORDERS:');
        
        // Verificar se existe tabela service_orders
        const [serviceOrdersExists] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'hospital_maintenance' 
            AND TABLE_NAME = 'service_orders'
        `);
        
        if (serviceOrdersExists[0].count > 0) {
            const [soColumns] = await connection.execute(`
                SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'hospital_maintenance' 
                AND TABLE_NAME = 'service_orders' 
                AND COLUMN_NAME = 'priority'
            `);
            
            if (soColumns.length > 0) {
                const col = soColumns[0];
                console.log(`   service_orders.priority: ${col.COLUMN_TYPE}`);
            } else {
                console.log('   ❌ Campo priority não encontrado em service_orders');
            }
        } else {
            console.log('   ℹ️ Tabela service_orders não existe');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await connection.end();
    }
}

debugPriorityField().catch(console.error);