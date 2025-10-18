const mysql = require('mysql2/promise');

async function debugPDFData() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
    });

    try {
        console.log('🔍 Debug completo da geração de PDF...\n');

        // 1. Verificar dados da ordem de serviço 89
        console.log('1. Dados da ordem de serviço 89:');
        const [serviceOrder] = await connection.execute(`
            SELECT 
                so.*,
                e.name as equipment_name,
                e.model as equipment_model,
                e.serial_number as equipment_serial,
                e.patrimonio as equipment_patrimonio,
                s.name as sector_name,
                ss.name as subsector_name,
                c.name as company_name,
                c.cnpj as company_cnpj,
                c.contact_phone as company_phone,
                c.address as company_address,
                u1.name as created_by_name,
                u2.name as assigned_to_name,
                mt.name as maintenance_type_name
            FROM service_orders so
            LEFT JOIN equipment e ON so.equipment_id = e.id
            LEFT JOIN sectors s ON e.sector_id = s.id
            LEFT JOIN subsectors ss ON e.subsector_id = ss.id
            LEFT JOIN companies c ON so.company_id = c.id
            LEFT JOIN users u1 ON so.created_by = u1.id
            LEFT JOIN users u2 ON so.assigned_to = u2.id
            LEFT JOIN maintenance_types mt ON so.maintenance_type_id = mt.id
            WHERE so.id = 89
        `);

        if (serviceOrder.length > 0) {
            const order = serviceOrder[0];
            console.log(`  - ID: ${order.id}`);
            console.log(`  - Número: ${order.order_number}`);
            console.log(`  - Company ID: ${order.company_id}`);
            console.log(`  - Company Name: ${order.company_name}`);
            console.log(`  - Company CNPJ: ${order.company_cnpj}`);
            console.log(`  - Company Address: ${order.company_address}`);
        } else {
            console.log('  ❌ Ordem de serviço não encontrada');
        }

        // 2. Verificar se existe "FUNDO MUNICIPAL" em alguma tabela
        console.log('\n2. Procurando por "FUNDO MUNICIPAL" nas tabelas:');
        
        const tables = ['companies', 'empresas', 'service_orders', 'equipment', 'users', 'sectors', 'subsectors'];
        
        for (const table of tables) {
            try {
                const [columns] = await connection.execute(`
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = 'hospital_maintenance' 
                    AND TABLE_NAME = '${table}'
                    AND DATA_TYPE IN ('varchar', 'text', 'char')
                `);

                for (const col of columns) {
                    const [results] = await connection.execute(`
                        SELECT * FROM ${table} 
                        WHERE ${col.COLUMN_NAME} LIKE '%FUNDO MUNICIPAL%' 
                        OR ${col.COLUMN_NAME} LIKE '%MUNICIPAL DE SAUDE%'
                        OR ${col.COLUMN_NAME} LIKE '%MUNICIPAL DE SAÚDE%'
                    `);

                    if (results.length > 0) {
                        console.log(`  ✅ Encontrado em ${table}.${col.COLUMN_NAME}:`);
                        results.forEach(row => {
                            console.log(`    - ID: ${row.id}, Valor: ${row[col.COLUMN_NAME]}`);
                        });
                    }
                }
            } catch (error) {
                console.log(`  ⚠️ Erro ao verificar tabela ${table}: ${error.message}`);
            }
        }

        // 3. Verificar configurações customizadas do PDF
        console.log('\n3. Verificando configurações customizadas do PDF:');
        try {
            const [settings] = await connection.execute(`
                SELECT * FROM pdf_settings WHERE is_active = 1
            `);

            if (settings.length > 0) {
                console.log('  ✅ Configurações encontradas:');
                settings.forEach(setting => {
                    console.log(`    - ${setting.setting_key}: ${setting.setting_value}`);
                });
            } else {
                console.log('  ❌ Nenhuma configuração customizada encontrada');
            }
        } catch (error) {
            console.log(`  ⚠️ Tabela pdf_settings não existe: ${error.message}`);
        }

        // 4. Verificar templates de PDF
        console.log('\n4. Verificando templates de PDF:');
        try {
            const [templates] = await connection.execute(`
                SELECT * FROM pdf_templates WHERE type = 'service-order'
            `);

            if (templates.length > 0) {
                console.log('  ✅ Templates encontrados:');
                templates.forEach(template => {
                    console.log(`    - ID: ${template.id}, Nome: ${template.name}`);
                    console.log(`    - Header Config: ${template.header_config}`);
                    console.log(`    - Footer Config: ${template.footer_config}`);
                });
            } else {
                console.log('  ❌ Nenhum template encontrado');
            }
        } catch (error) {
            console.log(`  ⚠️ Tabela pdf_templates não existe: ${error.message}`);
        }

        // 5. Verificar dados de todas as empresas
        console.log('\n5. Todas as empresas cadastradas:');
        const [allCompanies] = await connection.execute('SELECT * FROM companies');
        allCompanies.forEach(company => {
            console.log(`  - ID: ${company.id}, Nome: ${company.name}, CNPJ: ${company.cnpj}`);
            console.log(`    Endereço: ${company.address || 'null'}`);
        });

        console.log('\n🎯 CONCLUSÃO:');
        console.log('Se o PDF ainda mostra "FUNDO MUNICIPAL DE SAÚDE", pode ser:');
        console.log('1. Cache do navegador');
        console.log('2. Dados hardcoded no código JavaScript/TypeScript');
        console.log('3. Template ou configuração não encontrada no banco');
        console.log('4. Problema na consulta SQL da API');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await connection.end();
    }
}

debugPDFData();