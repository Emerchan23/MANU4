const mysql = require('mysql2/promise');

async function testPDFSettings() {
  let connection;
  
  try {
    console.log('🔌 Conectando ao banco de dados...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conexão estabelecida');
    
    // Buscar configurações PDF
    console.log('🔍 Buscando configurações PDF...');
    const [settings] = await connection.execute(`
      SELECT setting_key, setting_value 
      FROM system_settings 
      WHERE setting_key LIKE 'pdf_%'
      ORDER BY setting_key
    `);
    
    console.log('📊 Configurações encontradas:', settings.length);
    
    // Processar configurações
    const pdfSettings = {};
    
    settings.forEach((setting) => {
      let value = setting.setting_value;
      
      // Tentar fazer parse JSON para valores complexos
      try {
        value = JSON.parse(value);
      } catch {
        // Se não for JSON, manter como string
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(Number(value)) && value !== '') value = Number(value);
      }
      
      pdfSettings[setting.setting_key] = value;
      console.log(`  ${setting.setting_key}: ${JSON.stringify(value)}`);
    });
    
    console.log('\n🎯 Configurações processadas:');
    console.log('  Campos de assinatura habilitados:', pdfSettings.pdf_signature_enabled);
    console.log('  Campo 1:', pdfSettings.pdf_signature_field1_text);
    console.log('  Campo 2:', pdfSettings.pdf_signature_field2_text);
    console.log('  Margens:', {
      top: pdfSettings.pdf_margin_top,
      bottom: pdfSettings.pdf_margin_bottom,
      left: pdfSettings.pdf_margin_left,
      right: pdfSettings.pdf_margin_right
    });
    console.log('  Cores:', {
      primary: pdfSettings.pdf_primary_color,
      secondary: pdfSettings.pdf_secondary_color,
      text: pdfSettings.pdf_text_color
    });
    
    // Verificar se os valores "88" estão sendo carregados
    console.log('\n🔍 Verificando valores específicos:');
    if (pdfSettings.pdf_signature_field1_text && pdfSettings.pdf_signature_field1_text.includes('88')) {
      console.log('✅ Campo 1 contém "88":', pdfSettings.pdf_signature_field1_text);
    } else {
      console.log('❌ Campo 1 NÃO contém "88":', pdfSettings.pdf_signature_field1_text);
    }
    
    if (pdfSettings.pdf_signature_field2_text && pdfSettings.pdf_signature_field2_text.includes('88')) {
      console.log('✅ Campo 2 contém "88":', pdfSettings.pdf_signature_field2_text);
    } else {
      console.log('❌ Campo 2 NÃO contém "88":', pdfSettings.pdf_signature_field2_text);
    }
    
  } catch (error) {
    console.error('💥 Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

testPDFSettings();