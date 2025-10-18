const mysql = require('mysql2/promise');

async function testMaintenanceScheduleAPIFixed() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🔄 Testando API corrigida do agendamento ID 8...');
        
        // 1. Testar a consulta diretamente no banco
        console.log('\n📋 1. Testando consulta direta no banco...');
        const directQuery = `
            SELECT 
                ms.*,
                e.name as equipment_name,
                e.patrimonio as equipment_code,
                e.model as equipment_model,
                e.sector_id,
                c.name as company_name,
                u.name as assigned_user_name
            FROM maintenance_schedules ms
            LEFT JOIN equipment e ON ms.equipment_id = e.id
            LEFT JOIN empresas c ON ms.company_id = c.id
            LEFT JOIN users u ON ms.assigned_user_id = u.id
            WHERE ms.id = 8
        `;
        
        const [directResult] = await connection.execute(directQuery);
        
        if (directResult.length > 0) {
            const data = directResult[0];
            console.log('✅ Dados encontrados:');
            console.log(`   ID: ${data.id}`);
            console.log(`   Equipamento: ${data.equipment_name} (ID: ${data.equipment_id})`);
            console.log(`   Empresa: ${data.company_name || 'Não definida'} (ID: ${data.company_id || 'null'})`);
            console.log(`   Responsável: ${data.assigned_user_name || 'Não definido'} (ID: ${data.assigned_user_id || 'null'})`);
            console.log(`   Tipo Manutenção: ${data.maintenance_type || 'Não definido'}`);
            console.log(`   Status: ${data.status || 'Não definido'}`);
            console.log(`   Custo Estimado: R$ ${data.estimated_cost || '0.00'}`);
            console.log(`   Observações: ${data.observations || 'Nenhuma'}`);
            console.log(`   Plano Manutenção ID: ${data.maintenance_plan_id || 'null'}`);
        } else {
            console.log('❌ Nenhum agendamento encontrado com ID 8');
        }

        // 2. Testar via API HTTP
        console.log('\n🌐 2. Testando via API HTTP...');
        const fetch = (await import('node-fetch')).default;
        
        try {
            const response = await fetch('http://localhost:3000/api/maintenance-schedules/8');
            const apiData = await response.json();
            
            if (apiData.success) {
                console.log('✅ API retornou dados com sucesso:');
                console.log(`   ID: ${apiData.data.id}`);
                console.log(`   Equipamento: ${apiData.data.equipment_name} (ID: ${apiData.data.equipment_id})`);
                console.log(`   Empresa: ${apiData.data.company_name || 'Não definida'} (ID: ${apiData.data.company_id || 'null'})`);
                console.log(`   Responsável: ${apiData.data.assigned_user_name || 'Não definido'} (ID: ${apiData.data.assigned_user_id || 'null'})`);
                console.log(`   Tipo Manutenção: ${apiData.data.maintenance_type || 'Não definido'}`);
                console.log(`   Status: ${apiData.data.status || 'Não definido'}`);
                console.log(`   Custo Estimado: R$ ${apiData.data.estimated_cost || '0.00'}`);
                console.log(`   Observações: ${apiData.data.observations || 'Nenhuma'}`);
                console.log(`   Plano Manutenção ID: ${apiData.data.maintenance_plan_id || 'null'}`);
                
                // Verificar se todos os campos necessários estão presentes
                const requiredFields = ['company_id', 'assigned_user_id', 'maintenance_type', 'status', 'estimated_cost'];
                const missingFields = requiredFields.filter(field => apiData.data[field] === undefined);
                
                if (missingFields.length === 0) {
                    console.log('✅ Todos os campos necessários estão presentes na resposta da API');
                } else {
                    console.log('⚠️ Campos ausentes na resposta da API:', missingFields);
                }
            } else {
                console.log('❌ API retornou erro:', apiData.error);
            }
        } catch (apiError) {
            console.log('❌ Erro ao chamar API:', apiError.message);
        }

        // 3. Verificar estrutura da tabela
        console.log('\n🔍 3. Verificando estrutura da tabela maintenance_schedules...');
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'hospital_maintenance' 
            AND TABLE_NAME = 'maintenance_schedules'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.log('📊 Colunas da tabela:');
        columns.forEach(col => {
            console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    } finally {
        await connection.end();
    }
}

testMaintenanceScheduleAPIFixed().catch(console.error);