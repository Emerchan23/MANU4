const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkMaintenanceTypes() {
    let connection;
    
    try {
        console.log('🔍 Verificando tabela maintenance_types...');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'hospital_maintenance'
        });

        // Verificar se a tabela existe
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'maintenance_types'
        `, [process.env.DB_NAME || 'hospital_maintenance']);

        if (tables.length === 0) {
            console.log('❌ Tabela maintenance_types não existe!');
            console.log('📝 Criando tabela maintenance_types...');
            
            await connection.execute(`
                CREATE TABLE maintenance_types (
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
            
            console.log('✅ Tabela maintenance_types criada!');
        } else {
            console.log('✅ Tabela maintenance_types existe!');
        }

        // Verificar estrutura da tabela
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'maintenance_types'
            ORDER BY ORDINAL_POSITION
        `, [process.env.DB_NAME || 'hospital_maintenance']);

        console.log('\n📋 Estrutura da tabela maintenance_types:');
        columns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        // Verificar dados existentes
        const [data] = await connection.execute('SELECT * FROM maintenance_types ORDER BY id');
        
        console.log(`\n📊 Total de registros: ${data.length}`);
        
        if (data.length === 0) {
            console.log('📝 Inserindo dados básicos...');
            
            await connection.execute(`
                INSERT INTO maintenance_types (name, description) VALUES 
                ('PREVENTIVA', 'Manutenção preventiva programada'),
                ('CORRETIVA', 'Manutenção corretiva para reparo'),
                ('PREDITIVA', 'Manutenção baseada em condição')
            `);
            
            console.log('✅ Dados básicos inseridos!');
            
            // Verificar novamente
            const [newData] = await connection.execute('SELECT * FROM maintenance_types ORDER BY id');
            console.log('\n📋 Dados inseridos:');
            newData.forEach(row => {
                console.log(`  - ID: ${row.id}, Nome: ${row.name}, Descrição: ${row.description}`);
            });
        } else {
            console.log('\n📋 Dados existentes:');
            data.forEach(row => {
                console.log(`  - ID: ${row.id}, Nome: ${row.name}, Descrição: ${row.description}, Ativo: ${row.is_active}`);
            });
        }

    } catch (error) {
        console.error('❌ Erro ao verificar maintenance_types:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkMaintenanceTypes();