const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkLogoTable() {
  let connection;
  
  try {
    console.log('🔌 Conectando ao banco de dados...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados');
    
    // Verificar estrutura da tabela
    console.log('\n📋 Estrutura da tabela logo_uploads:');
    const [structure] = await connection.execute('DESCRIBE logo_uploads');
    structure.forEach(column => {
      console.log(`  • ${column.Field}: ${column.Type} ${column.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${column.Key ? `[${column.Key}]` : ''} ${column.Default !== null ? `Default: ${column.Default}` : ''}`);
    });
    
    // Verificar dados na tabela
    console.log('\n📊 Dados na tabela logo_uploads:');
    const [logos] = await connection.execute('SELECT * FROM logo_uploads ORDER BY id DESC');
    
    if (logos.length === 0) {
      console.log('  ❌ Nenhum logo encontrado');
    } else {
      logos.forEach((logo, index) => {
        console.log(`\n  Logo ${index + 1}:`);
        console.log(`    • ID: ${logo.id}`);
        console.log(`    • Nome original: ${logo.original_name}`);
        console.log(`    • Nome do arquivo: ${logo.file_name}`);
        console.log(`    • Caminho: ${logo.file_path}`);
        console.log(`    • Tipo MIME: ${logo.mime_type}`);
        console.log(`    • Tamanho: ${logo.file_size} bytes`);
        console.log(`    • Ativo: ${logo.is_active}`);
        console.log(`    • Largura: ${logo.width || 'N/A'}`);
        console.log(`    • Altura: ${logo.height || 'N/A'}`);
        console.log(`    • Criado em: ${logo.created_at || 'N/A'}`);
      });
    }
    
    // Verificar logos ativos
    console.log('\n🎯 Logos ativos:');
    const [activeLogos] = await connection.execute('SELECT * FROM logo_uploads WHERE is_active = TRUE ORDER BY id DESC');
    
    if (activeLogos.length === 0) {
      console.log('  ❌ Nenhum logo ativo encontrado');
    } else {
      console.log(`  ✅ ${activeLogos.length} logo(s) ativo(s) encontrado(s)`);
      activeLogos.forEach((logo, index) => {
        console.log(`    ${index + 1}. ${logo.original_name} (ID: ${logo.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com banco fechada');
    }
  }
}

checkLogoTable();