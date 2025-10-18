const mysql = require('mysql2/promise');

async function verifyPdfTables() {
  let connection;
  
  try {
    console.log('🔌 Conectando ao banco de dados...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados');
    
    // Verificar tabelas PDF
    const [tables] = await connection.query(`
      SELECT TABLE_NAME, TABLE_ROWS 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'hospital_maintenance' 
      AND TABLE_NAME IN ('pdf_templates', 'pdf_exports', 'logo_uploads')
      ORDER BY TABLE_NAME
    `);
    
    console.log('\n📊 Tabelas PDF encontradas:');
    tables.forEach(table => {
      console.log(`  ✅ ${table.TABLE_NAME} (${table.TABLE_ROWS} registros)`);
    });
    
    // Verificar templates padrão
    const [templates] = await connection.query('SELECT COUNT(*) as count FROM pdf_templates');
    console.log(`\n📄 Templates PDF: ${templates[0].count}`);
    
    // Verificar configurações PDF
    const [settings] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM system_settings 
      WHERE setting_key LIKE 'pdf_%'
    `);
    console.log(`⚙️ Configurações PDF: ${settings[0].count}`);
    
    // Listar configurações PDF
    const [pdfSettings] = await connection.query(`
      SELECT setting_key, setting_value, description 
      FROM system_settings 
      WHERE setting_key LIKE 'pdf_%'
      ORDER BY setting_key
    `);
    
    if (pdfSettings.length > 0) {
      console.log('\n🔧 Configurações PDF instaladas:');
      pdfSettings.forEach(setting => {
        console.log(`  • ${setting.setting_key}: ${setting.setting_value}`);
        console.log(`    ${setting.description}`);
      });
    }
    
    console.log('\n🎉 Verificação concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com banco fechada');
    }
  }
}

// Executar verificação
verifyPdfTables().catch(console.error);