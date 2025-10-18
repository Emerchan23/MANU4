const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function executeTemplatesSQL() {
    let connection;
    try {
        // Criar conexão com o banco usando configurações do .env
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'hospital_maintenance',
            port: process.env.DB_PORT || 3306
        });

        console.log('Conectado ao banco de dados!');

        // Ler o arquivo SQL
        const sql = fs.readFileSync('04-create-templates-tables.sql', 'utf8');
        
        // Dividir em statements individuais
        const statements = sql.split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== 'USE hospital_maintenance');

        console.log(`Executando ${statements.length} statements...`);

        // Executar cada statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    await connection.execute(statement);
                    console.log(`✓ Statement ${i + 1} executado com sucesso`);
                } catch (error) {
                    if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_ENTRY') {
                        console.log(`⚠ Statement ${i + 1} já existe (ignorado)`);
                    } else {
                        console.error(`✗ Erro no statement ${i + 1}:`, error.message);
                    }
                }
            }
        }

        console.log('\n✅ Script SQL executado com sucesso!');
        
        // Verificar se as tabelas foram criadas
        const [tables] = await connection.execute("SHOW TABLES LIKE '%template%'");
        console.log('\nTabelas de templates encontradas:');
        tables.forEach(table => {
            console.log(`- ${Object.values(table)[0]}`);
        });

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nConexão fechada.');
        }
    }
}

executeTemplatesSQL();