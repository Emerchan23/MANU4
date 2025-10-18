const mysql = require('mysql2/promise');
const fs = require('fs');

async function runDatabaseUpdate() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance',
        multipleStatements: true
    });

    try {
        console.log('🔄 Executando atualização do banco de dados...');

        // Ler o arquivo SQL
        const sqlContent = fs.readFileSync('./add-missing-fields-maintenance-schedules.sql', 'utf8');
        
        // Executar o SQL
        const [results] = await connection.execute(sqlContent);
        
        console.log('✅ Atualização executada com sucesso!');
        console.log('📊 Resultados:', results);

    } catch (error) {
        console.error('❌ Erro ao executar atualização:', error.message);
        
        // Se o erro for que a coluna já existe, isso é OK
        if (error.message.includes('Duplicate column name')) {
            console.log('ℹ️ Campos já existem na tabela, continuando...');
        } else {
            throw error;
        }
    } finally {
        await connection.end();
    }
}

runDatabaseUpdate();