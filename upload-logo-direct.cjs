const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function uploadLogoDirect() {
  let connection;
  
  try {
    console.log('🔍 Fazendo upload direto do logo para o banco de dados...');
    
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados');
    
    // Caminho do logo SVG que já existe
    const logoPath = path.join(process.cwd(), 'public', 'uploads', 'logos', 'logo-fundo-saude.svg');
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(logoPath)) {
      console.error('❌ Arquivo de logo não encontrado:', logoPath);
      return;
    }
    
    console.log('✅ Logo encontrado:', logoPath);
    
    // Obter informações do arquivo
    const stats = fs.statSync(logoPath);
    const fileName = 'logo-fundo-saude.svg';
    const originalName = 'Logo Fundo Municipal de Saúde de Chapadão do Céu';
    const filePath = '/uploads/logos/logo-fundo-saude.svg';
    const mimeType = 'image/svg+xml';
    const fileSize = stats.size;
    
    // Inserir no banco de dados
    const result = await connection.execute(
      `INSERT INTO logo_uploads (original_name, file_name, file_path, mime_type, file_size, is_active)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [originalName, fileName, filePath, mimeType, fileSize]
    );
    
    console.log('✅ Logo inserido no banco com sucesso!');
    console.log('📊 ID do logo:', result[0].insertId);
    console.log('📁 Caminho:', filePath);
    console.log('📏 Tamanho:', fileSize, 'bytes');
    
    // Verificar se foi inserido corretamente
    const [logos] = await connection.execute(
      'SELECT * FROM logo_uploads WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1'
    );
    
    if (logos.length > 0) {
      console.log('\n✅ Verificação: Logo encontrado no banco!');
      console.log('📋 Dados do logo:', logos[0]);
    }
    
  } catch (error) {
    console.error('❌ Erro ao fazer upload do logo:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão com banco fechada');
    }
  }
}

uploadLogoDirect();