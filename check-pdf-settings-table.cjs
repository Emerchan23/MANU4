const mysql = require('mysql2/promise');

async function checkPDFSettingsTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA pdf_settings...\n');
    
    // Verificar se a tabela existe
    const [tables] = await connection.execute('SHOW TABLES LIKE "pdf_settings"');
    
    if (tables.length === 0) {
      console.log('❌ Tabela pdf_settings não existe!');
      console.log('🔧 Criando tabela pdf_settings...');
      
      const createTableQuery = `
        CREATE TABLE pdf_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          pdf_logo_enabled BOOLEAN DEFAULT TRUE,
          pdf_header_enabled BOOLEAN DEFAULT TRUE,
          pdf_company_name VARCHAR(255) DEFAULT 'FUNDO MUN SAUDE DE CHAPADÃO DO CÉU',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `;
      
      await connection.execute(createTableQuery);
      console.log('✅ Tabela pdf_settings criada!');
      
      // Inserir configuração padrão
      const insertQuery = `
        INSERT INTO pdf_settings (pdf_logo_enabled, pdf_header_enabled, pdf_company_name, is_active)
        VALUES (TRUE, TRUE, 'FUNDO MUN SAUDE DE CHAPADÃO DO CÉU', TRUE)
      `;
      
      await connection.execute(insertQuery);
      console.log('✅ Configuração padrão inserida!');
      
    } else {
      console.log('✅ Tabela pdf_settings existe');
      
      // Verificar estrutura da tabela
      const [columns] = await connection.execute('DESCRIBE pdf_settings');
      console.log('\n📋 Estrutura da tabela:');
      columns.forEach(col => {
        console.log(`   - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
      
      // Verificar dados existentes
      const [data] = await connection.execute('SELECT * FROM pdf_settings');
      console.log(`\n📊 Registros encontrados: ${data.length}`);
      
      if (data.length === 0) {
        console.log('🔧 Inserindo configuração padrão...');
        const insertQuery = `
          INSERT INTO pdf_settings (pdf_logo_enabled, pdf_header_enabled, pdf_company_name, is_active)
          VALUES (TRUE, TRUE, 'FUNDO MUN SAUDE DE CHAPADÃO DO CÉU', TRUE)
        `;
        
        await connection.execute(insertQuery);
        console.log('✅ Configuração padrão inserida!');
      } else {
        data.forEach((row, index) => {
          console.log(`   Registro ${index + 1}:`);
          console.log(`     - ID: ${row.id}`);
          console.log(`     - Logo habilitado: ${row.pdf_logo_enabled ? 'SIM' : 'NÃO'}`);
          console.log(`     - Header habilitado: ${row.pdf_header_enabled ? 'SIM' : 'NÃO'}`);
          console.log(`     - Nome empresa: ${row.pdf_company_name || 'NÃO DEFINIDO'}`);
          console.log(`     - Ativo: ${row.is_active ? 'SIM' : 'NÃO'}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkPDFSettingsTable();