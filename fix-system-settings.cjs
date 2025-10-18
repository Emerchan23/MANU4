const mysql = require('mysql2/promise');

async function fixSystemSettings() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  console.log('=== CORRIGINDO CONFIGURAÇÃO PDF_COMPANY_NAME EM SYSTEM_SETTINGS ===\n');

  try {
    // Verificar se a tabela system_settings existe
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'hospital_maintenance' 
      AND TABLE_NAME = 'system_settings'
    `);
    
    if (tables.length === 0) {
      console.log('Tabela system_settings não existe');
      return;
    }

    // Verificar configurações atuais
    const [currentSettings] = await connection.execute(`
      SELECT * FROM system_settings WHERE setting_key = 'pdf_company_name'
    `);
    
    console.log('Configuração atual:');
    console.log(JSON.stringify(currentSettings, null, 2));

    if (currentSettings.length > 0) {
      // Atualizar a configuração problemática
      const [result] = await connection.execute(`
        UPDATE system_settings 
        SET setting_value = '' 
        WHERE setting_key = 'pdf_company_name'
      `);
      
      console.log('Configuração atualizada:', result.affectedRows, 'linha(s) afetada(s)');
      
      // Verificar se foi atualizada
      const [updatedSettings] = await connection.execute(`
        SELECT * FROM system_settings WHERE setting_key = 'pdf_company_name'
      `);
      
      console.log('Configuração após atualização:');
      console.log(JSON.stringify(updatedSettings, null, 2));
    } else {
      console.log('Configuração pdf_company_name não encontrada em system_settings');
    }

  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
  } finally {
    await connection.end();
  }
}

fixSystemSettings().catch(console.error);