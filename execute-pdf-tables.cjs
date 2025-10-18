const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function createPdfTables() {
  let connection;
  
  try {
    console.log('🔌 Conectando ao banco de dados...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance',
      multipleStatements: true
    });
    
    console.log('✅ Conectado ao banco de dados');
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'scripts', 'create-pdf-tables.sql');
    console.log('📄 Lendo arquivo SQL:', sqlPath);
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Dividir em statements individuais
    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
    
    console.log(`📝 Executando ${statements.length} comandos SQL...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          console.log(`⚡ Executando comando ${i + 1}/${statements.length}...`);
          await connection.query(statement);
        } catch (error) {
          console.warn(`⚠️ Aviso no comando ${i + 1}: ${error.message}`);
          // Continuar mesmo com avisos (como tabelas que já existem)
        }
      }
    }
    
    // Criar diretórios necessários
    console.log('📁 Criando diretórios necessários...');
    
    const publicDir = path.join(__dirname, 'public');
    const uploadsDir = path.join(publicDir, 'uploads');
    const logosDir = path.join(uploadsDir, 'logos');
    const pdfExportsDir = path.join(uploadsDir, 'pdf-exports');
    
    // Criar diretórios se não existirem
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
      console.log('✅ Diretório public criado');
    }
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Diretório uploads criado');
    }
    
    if (!fs.existsSync(logosDir)) {
      fs.mkdirSync(logosDir, { recursive: true });
      console.log('✅ Diretório logos criado');
    }
    
    if (!fs.existsSync(pdfExportsDir)) {
      fs.mkdirSync(pdfExportsDir, { recursive: true });
      console.log('✅ Diretório pdf-exports criado');
    }
    
    // Verificar se as tabelas foram criadas
    console.log('🔍 Verificando tabelas criadas...');
    
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'hospital_maintenance' 
      AND TABLE_NAME IN ('pdf_templates', 'pdf_exports', 'logo_uploads')
    `);
    
    console.log('📊 Tabelas encontradas:');
    tables.forEach(table => {
      console.log(`  ✅ ${table.TABLE_NAME}`);
    });
    
    console.log('\n🎉 Tabelas PDF criadas com sucesso!');
    console.log('📋 Sistema de exportação PDF configurado e pronto para uso.');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão com banco fechada');
    }
  }
}

// Executar o script
createPdfTables().catch(console.error);