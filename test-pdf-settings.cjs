// Script para testar as configurações de PDF no banco de dados
const mysql = require('mysql2/promise');

async function testPdfSettings() {
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
    
    // Verificar se existem configurações PDF
    const [settings] = await connection.query(`
      SELECT setting_key, setting_value 
      FROM system_settings 
      WHERE setting_key LIKE 'pdf_%' 
      ORDER BY setting_key
    `);
    
    console.log('\n📊 Configurações PDF encontradas:');
    if (settings.length === 0) {
      console.log('❌ Nenhuma configuração PDF encontrada no banco!');
      
      // Inserir configurações padrão
      console.log('\n🔧 Inserindo configurações padrão...');
      const defaultSettings = [
        ['pdf_header_enabled', 'true'],
        ['pdf_header_text', 'Sistema de Manutenção Hospitalar'],
        ['pdf_footer_enabled', 'true'],
        ['pdf_footer_text', 'Relatório gerado automaticamente pelo sistema'],
        ['pdf_logo_enabled', 'true'],
        ['pdf_company_name', 'Hospital'],
        ['pdf_company_address', ''],
        ['pdf_show_date', 'true'],
        ['pdf_show_page_numbers', 'true'],
        ['pdf_margin_top', '20'],
        ['pdf_margin_bottom', '20'],
        ['pdf_margin_left', '15'],
        ['pdf_margin_right', '15']
      ];
      
      for (const [key, value] of defaultSettings) {
        await connection.query(
          `INSERT INTO system_settings (setting_key, setting_value, description) 
           VALUES (?, ?, ?) 
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
          [key, value, `Configuração PDF: ${key}`]
        );
      }
      
      console.log('✅ Configurações padrão inseridas!');
      
      // Verificar novamente
      const [newSettings] = await connection.query(`
        SELECT setting_key, setting_value 
        FROM system_settings 
        WHERE setting_key LIKE 'pdf_%' 
        ORDER BY setting_key
      `);
      
      console.log('\n📊 Configurações PDF após inserção:');
      newSettings.forEach(setting => {
        console.log(`  ✅ ${setting.setting_key}: ${setting.setting_value}`);
      });
    } else {
      settings.forEach(setting => {
        console.log(`  ✅ ${setting.setting_key}: ${setting.setting_value}`);
      });
    }
    
    console.log('\n🎉 Teste concluído com sucesso!');
    
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

// Executar teste
testPdfSettings().catch(console.error);