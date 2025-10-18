const mysql = require('mysql2/promise');
const fs = require('fs');

async function createTables() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'hospital_maintenance'
        });

        console.log('Conectado ao banco de dados...');

        // Criar tabela template_categories
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS template_categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                color VARCHAR(7) DEFAULT '#3B82F6',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Tabela template_categories criada!');

        // Criar tabela service_description_templates
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS service_description_templates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT NOT NULL,
                category_id INT,
                is_active BOOLEAN DEFAULT TRUE,
                usage_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES template_categories(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Tabela service_description_templates criada!');

        // Inserir categorias
        await connection.execute(`
            INSERT IGNORE INTO template_categories (name, description, color) VALUES
            ('Manutenção Preventiva', 'Templates para serviços de manutenção preventiva', '#10B981'),
            ('Manutenção Corretiva', 'Templates para serviços de manutenção corretiva', '#EF4444'),
            ('Instalação', 'Templates para serviços de instalação de equipamentos', '#8B5CF6'),
            ('Calibração', 'Templates para serviços de calibração e ajustes', '#F59E0B')
        `);
        console.log('Categorias inseridas!');

        // Inserir templates
        await connection.execute(`
            INSERT IGNORE INTO service_description_templates (name, description, category_id) VALUES
            ('Manutenção Preventiva Completa', 'Realizar limpeza geral, verificação de componentes, lubrificação e testes de funcionamento.', 1),
            ('Reparo de Equipamento Eletrônico', 'Diagnosticar falha, substituir componentes defeituosos e realizar testes de validação.', 2),
            ('Instalação de Equipamento Médico', 'Desembalar, posicionar, conectar e configurar equipamento conforme especificações.', 3),
            ('Calibração de Instrumentos', 'Ajustar parâmetros, verificar precisão e emitir certificado de calibração.', 4),
            ('Limpeza e Desinfecção', 'Realizar limpeza completa, desinfecção e verificação de funcionamento.', 1),
            ('Substituição de Peças', 'Identificar peça defeituosa, substituir e testar funcionamento do equipamento.', 2),
            ('Configuração de Software', 'Instalar, configurar e testar software específico do equipamento.', 3),
            ('Verificação de Segurança', 'Testar sistemas de segurança, alarmes e dispositivos de proteção.', 1),
            ('Atualização de Software', 'Realizar backup, instalar atualizações de software e verificar compatibilidade.', 2),
            ('Teste de Performance', 'Executar testes de performance, verificar parâmetros e documentar resultados.', 4)
        `);
        console.log('Templates inseridos!');

        // Adicionar comentários
        await connection.execute(`ALTER TABLE template_categories COMMENT = 'Categorias para organizar templates de descrição de serviços'`);
        await connection.execute(`ALTER TABLE service_description_templates COMMENT = 'Templates pré-definidos para descrições de serviços de manutenção'`);

        console.log('\n✅ Tabelas de templates criadas com sucesso!');
        console.log('📊 Total de categorias: 4');
        console.log('📝 Total de templates: 10');

    } catch (error) {
        console.error('❌ Erro ao criar tabelas:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

createTables().catch(console.error);