const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTiposManutencao() {
    let connection;
    
    try {
        console.log('🔍 Verificando tabela tipos_manutencao...');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'hospital_maintenance'
        });

        // Verificar se a tabela tipos_manutencao existe
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tipos_manutencao'
        `, [process.env.DB_NAME || 'hospital_maintenance']);

        if (tables.length === 0) {
            console.log('❌ Tabela tipos_manutencao NÃO existe!');
            console.log('📝 Criando tabela tipos_manutencao...');
            
            await connection.execute(`
                CREATE TABLE tipos_manutencao (
                    id INT(11) NOT NULL AUTO_INCREMENT,
                    nome VARCHAR(100) NOT NULL,
                    descricao TEXT NULL,
                    categoria VARCHAR(50) NOT NULL DEFAULT 'preventiva',
                    ativo BOOLEAN NOT NULL DEFAULT TRUE,
                    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
                    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    UNIQUE KEY uk_tipos_manutencao_nome (nome)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            
            console.log('✅ Tabela tipos_manutencao criada!');
            
            // Inserir dados básicos
            await connection.execute(`
                INSERT INTO tipos_manutencao (nome, descricao, categoria) VALUES 
                ('Preventiva', 'Manutenção preventiva programada', 'preventiva'),
                ('Corretiva', 'Manutenção corretiva para reparo', 'corretiva'),
                ('Preditiva', 'Manutenção baseada em condição', 'preditiva'),
                ('Calibração', 'Calibração de equipamentos', 'calibracao'),
                ('Instalação', 'Instalação de novos equipamentos', 'instalacao'),
                ('Desinstalação', 'Remoção de equipamentos', 'desinstalacao'),
                ('Consultoria', 'Serviços de consultoria técnica', 'consultoria')
            `);
            
            console.log('✅ Dados básicos inseridos!');
        } else {
            console.log('✅ Tabela tipos_manutencao existe!');
        }

        // Verificar dados existentes
        const [data] = await connection.execute('SELECT * FROM tipos_manutencao WHERE ativo = 1 ORDER BY nome');
        
        console.log(`\n📊 Total de registros ativos: ${data.length}`);
        
        if (data.length > 0) {
            console.log('\n📋 Dados existentes:');
            data.forEach(row => {
                console.log(`  - ID: ${row.id}, Nome: ${row.nome}, Categoria: ${row.categoria}, Ativo: ${row.ativo}`);
            });
        }

    } catch (error) {
        console.error('❌ Erro ao verificar tipos_manutencao:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkTiposManutencao();