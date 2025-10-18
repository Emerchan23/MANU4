const mysql = require('mysql2/promise');

async function checkTables() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🔍 VERIFICANDO TABELAS DO BANCO...\n');

        // Listar todas as tabelas
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('📊 TABELAS DISPONÍVEIS:');
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`   - ${tableName}`);
        });

        // Verificar se existe tabela de equipamentos
        const equipmentTables = tables.filter(table => {
            const tableName = Object.values(table)[0].toLowerCase();
            return tableName.includes('equipment') || tableName.includes('equipamento');
        });

        console.log('\n🔧 TABELAS DE EQUIPAMENTOS:');
        if (equipmentTables.length > 0) {
            equipmentTables.forEach(table => {
                const tableName = Object.values(table)[0];
                console.log(`   ✅ ${tableName}`);
            });
        } else {
            console.log('   ❌ Nenhuma tabela de equipamentos encontrada');
        }

        // Verificar estrutura da tabela maintenance_schedules
        console.log('\n📋 ESTRUTURA DA TABELA maintenance_schedules:');
        const [columns] = await connection.execute('DESCRIBE maintenance_schedules');
        columns.forEach(col => {
            console.log(`   ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        // Verificar último agendamento criado
        console.log('\n📝 ÚLTIMO AGENDAMENTO CRIADO:');
        const [lastAppointment] = await connection.execute(`
            SELECT id, equipment_id, estimated_cost, company_id, observations, created_at
            FROM maintenance_schedules 
            ORDER BY id DESC 
            LIMIT 1
        `);

        if (lastAppointment.length > 0) {
            const appointment = lastAppointment[0];
            console.log(`   ID: ${appointment.id}`);
            console.log(`   Equipment ID: ${appointment.equipment_id}`);
            console.log(`   Estimated Cost: ${appointment.estimated_cost} (${typeof appointment.estimated_cost})`);
            console.log(`   Company ID: ${appointment.company_id} (${typeof appointment.company_id})`);
            console.log(`   Observations: ${appointment.observations} (${typeof appointment.observations})`);
            console.log(`   Created At: ${appointment.created_at}`);
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await connection.end();
    }
}

checkTables().catch(console.error);