const mysql = require('mysql2/promise');

async function fixSettings() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  console.log('=== CORRIGINDO CONFIGURAÇÃO PDF_COMPANY_NAME ===\n');

  try {
    // Atualizar a configuração problemática
    const [result] = await connection.execute(`
      UPDATE settings 
      SET setting_value = '' 
      WHERE setting_key = 'pdf_company_name'
    `);
    
    console.log('Configuração atualizada:', result.affectedRows, 'linha(s) afetada(s)');
    
    // Verificar se foi atualizada
    const [rows] = await connection.execute(`
      SELECT * FROM settings WHERE setting_key = 'pdf_company_name'
    `);
    
    console.log('Configuração atual:');
    console.log(JSON.stringify(rows, null, 2));

  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
  } finally {
    await connection.end();
  }
}

fixSettings().catch(console.error);