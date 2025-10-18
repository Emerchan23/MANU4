const mysql = require('mysql2/promise');

async function fixPDFSettings() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    console.log('🔧 CORRIGINDO CONFIGURAÇÕES DO PDF...\n');
    
    // Atualizar configurações para habilitar logo e header
    const updateQuery = `
      UPDATE pdf_settings 
      SET 
        pdf_logo_enabled = TRUE,
        pdf_header_enabled = TRUE,
        pdf_company_name = 'FUNDO MUN SAUDE DE CHAPADÃO DO CÉU'
      WHERE is_active = 1
    `;
    
    const [result] = await connection.execute(updateQuery);
    console.log('✅ Configurações atualizadas:', result.affectedRows, 'registro(s)');
    
    // Verificar se as configurações foram aplicadas
    const [updatedSettings] = await connection.execute('SELECT * FROM pdf_settings WHERE is_active = 1 LIMIT 1');
    
    if (updatedSettings.length > 0) {
      const settings = updatedSettings[0];
      console.log('\n📋 Configurações após atualização:');
      console.log(`   - Logo habilitado: ${settings.pdf_logo_enabled ? 'SIM' : 'NÃO'}`);
      console.log(`   - Header habilitado: ${settings.pdf_header_enabled ? 'SIM' : 'NÃO'}`);
      console.log(`   - Nome da empresa: ${settings.pdf_company_name || 'NÃO DEFINIDO'}`);
    }
    
    console.log('\n🎉 CONFIGURAÇÕES CORRIGIDAS COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir configurações:', error.message);
  } finally {
    await connection.end();
  }
}

fixPDFSettings();