const mysql = require('mysql2/promise');

async function updatePDFSettings() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    console.log('🔧 ATUALIZANDO CONFIGURAÇÕES DO PDF...\n');
    
    // Atualizar configurações usando os nomes corretos das colunas
    const updateQuery = `
      UPDATE pdf_settings 
      SET 
        logo_enabled = 1,
        company_name = 'FUNDO MUN SAUDE DE CHAPADÃO DO CÉU'
      WHERE is_active = 1
    `;
    
    const [result] = await connection.execute(updateQuery);
    console.log('✅ Configurações atualizadas:', result.affectedRows, 'registro(s)');
    
    // Verificar se as configurações foram aplicadas
    const [updatedSettings] = await connection.execute('SELECT * FROM pdf_settings WHERE is_active = 1 LIMIT 1');
    
    if (updatedSettings.length > 0) {
      const settings = updatedSettings[0];
      console.log('\n📋 Configurações após atualização:');
      console.log(`   - Logo habilitado: ${settings.logo_enabled ? 'SIM' : 'NÃO'}`);
      console.log(`   - Nome da empresa: ${settings.company_name || 'NÃO DEFINIDO'}`);
    }
    
    console.log('\n🎉 CONFIGURAÇÕES CORRIGIDAS COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir configurações:', error.message);
  } finally {
    await connection.end();
  }
}

updatePDFSettings();