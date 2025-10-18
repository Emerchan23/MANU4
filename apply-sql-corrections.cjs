const mysql = require('mysql2/promise');

async function applySQLCorrections() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance',
        multipleStatements: true
    });

    try {
        console.log('🔧 Aplicando correções SQL...');

        // 1. Correção de ENUM de prioridades
        await connection.execute(`
            ALTER TABLE service_orders 
            MODIFY COLUMN priority ENUM('BAIXA','MEDIA','ALTA','CRITICA') NOT NULL DEFAULT 'MEDIA'
        `);
        console.log('✅ Prioridades corrigidas');

        // 2. Correção de ENUM de status
        await connection.execute(`
            ALTER TABLE service_orders 
            MODIFY COLUMN status ENUM('ABERTA','EM_ANDAMENTO','AGUARDANDO_APROVACAO','APROVADA','REJEITADA','CONCLUIDA','CANCELADA') NOT NULL DEFAULT 'ABERTA'
        `);
        console.log('✅ Status corrigidos');

        // 3. Ajuste de tipo de dados para custo
        await connection.execute(`
            ALTER TABLE service_orders 
            MODIFY COLUMN cost DECIMAL(12,2) UNSIGNED NULL DEFAULT NULL
        `);
        console.log('✅ Tipo de dados de custo ajustado');

        // 4. Criar tabela maintenance_types se não existir
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS maintenance_types (
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
        console.log('✅ Tabela maintenance_types criada/verificada');

        // 5. Inserir tipos básicos de manutenção
        await connection.execute(`
            INSERT IGNORE INTO maintenance_types (name, description) VALUES 
            ('PREVENTIVA', 'Manutenção preventiva programada'),
            ('CORRETIVA', 'Manutenção corretiva para reparo'),
            ('PREDITIVA', 'Manutenção baseada em condição')
        `);
        console.log('✅ Tipos de manutenção inseridos');

        // 6. Verificar se tabela empresas existe
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS empresas (
                id INT(11) NOT NULL AUTO_INCREMENT,
                nome VARCHAR(255) NOT NULL,
                cnpj VARCHAR(18) NULL,
                telefone VARCHAR(20) NULL,
                email VARCHAR(255) NULL,
                endereco TEXT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabela empresas criada/verificada');

        // 7. Inserir empresa TechMed se não existir (usando colunas corretas)
        await connection.execute(`
            INSERT IGNORE INTO empresas (name, cnpj, phone, email) VALUES 
            ('TechMed Soluções', '12.345.678/0001-90', '(11) 99999-9999', 'contato@techmed.com.br')
        `);
        console.log('✅ Empresa TechMed inserida');

        // 8. Verificar se tabela equipment existe
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS equipment (
                id INT(11) NOT NULL AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                model VARCHAR(100) NULL,
                serial_number VARCHAR(100) NULL,
                manufacturer VARCHAR(100) NULL,
                location VARCHAR(255) NULL,
                status ENUM('ATIVO','INATIVO','MANUTENCAO') DEFAULT 'ATIVO',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabela equipment criada/verificada');

        // 9. Inserir equipamento Ventilador se não existir (usando colunas corretas)
        await connection.execute(`
            INSERT IGNORE INTO equipment (name, model, serial_number, manufacturer, sector_id, category_id, status) VALUES 
            ('Ventilador Pulmonar', 'VP-2024', 'VNT001', 'MedTech', 8, 1, 'ativo')
        `);
        console.log('✅ Equipamento Ventilador inserido');

        // 10. Adicionar índices de performance
        try {
            await connection.execute(`CREATE INDEX idx_service_orders_priority ON service_orders(priority)`);
        } catch (e) { /* Índice já existe */ }
        
        try {
            await connection.execute(`CREATE INDEX idx_service_orders_requested_date ON service_orders(requested_date)`);
        } catch (e) { /* Índice já existe */ }
        
        console.log('✅ Índices de performance adicionados');

        console.log('🎉 Todas as correções SQL foram aplicadas com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao aplicar correções SQL:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

applySQLCorrections().catch(console.error);