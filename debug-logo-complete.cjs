const mysql = require('mysql2/promise');

async function debugLogoIssue() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    console.log('🔍 INVESTIGAÇÃO COMPLETA DO PROBLEMA DO LOGO\n');
    
    // 1. Verificar configurações PDF
    console.log('1. Verificando configurações PDF:');
    const [pdfSettings] = await connection.execute('SELECT * FROM pdf_settings WHERE is_active = 1 LIMIT 1');
    
    if (pdfSettings.length > 0) {
      const settings = pdfSettings[0];
      console.log('   ✅ Configurações encontradas:');
      console.log(`   - Logo habilitado: ${settings.pdf_logo_enabled ? 'SIM' : 'NÃO'}`);
      console.log(`   - Header habilitado: ${settings.pdf_header_enabled ? 'SIM' : 'NÃO'}`);
      console.log(`   - Nome da empresa: ${settings.pdf_company_name || 'NÃO DEFINIDO'}`);
    } else {
      console.log('   ❌ Nenhuma configuração PDF encontrada!');
    }
    
    // 2. Verificar logos disponíveis
    console.log('\n2. Verificando logos disponíveis:');
    const [logos] = await connection.execute('SELECT * FROM logo_uploads WHERE is_active = TRUE ORDER BY uploaded_at DESC');
    
    if (logos.length > 0) {
      console.log(`   ✅ ${logos.length} logo(s) ativo(s) encontrado(s):`);
      logos.forEach((logo, index) => {
        console.log(`   Logo ${index + 1}:`);
        console.log(`     - ID: ${logo.id}`);
        console.log(`     - Nome: ${logo.original_name}`);
        console.log(`     - Caminho: ${logo.file_path}`);
        console.log(`     - MIME: ${logo.mime_type}`);
        console.log(`     - Tamanho: ${logo.file_size} bytes`);
      });
    } else {
      console.log('   ❌ Nenhum logo ativo encontrado!');
    }
    
    // 3. Verificar arquivos físicos
    console.log('\n3. Verificando arquivos físicos:');
    const fs = require('fs');
    const path = require('path');
    
    if (logos.length > 0) {
      logos.forEach((logo, index) => {
        const logoPath = path.join(process.cwd(), 'public', logo.file_path);
        const exists = fs.existsSync(logoPath);
        console.log(`   Logo ${index + 1}: ${exists ? '✅ EXISTE' : '❌ NÃO EXISTE'} - ${logoPath}`);
        
        if (exists) {
          const stats = fs.statSync(logoPath);
          console.log(`     - Tamanho no disco: ${stats.size} bytes`);
          console.log(`     - Última modificação: ${stats.mtime}`);
        }
      });
    }
    
    // 4. Testar conversão base64
    console.log('\n4. Testando conversão base64:');
    if (logos.length > 0) {
      const logo = logos[0];
      const logoPath = path.join(process.cwd(), 'public', logo.file_path);
      
      if (fs.existsSync(logoPath)) {
        try {
          const imageBuffer = fs.readFileSync(logoPath);
          const base64Image = imageBuffer.toString('base64');
          console.log(`   ✅ Conversão base64 bem-sucedida`);
          console.log(`   - Tamanho base64: ${base64Image.length} caracteres`);
          console.log(`   - Primeiros 50 chars: ${base64Image.substring(0, 50)}...`);
        } catch (error) {
          console.log(`   ❌ Erro na conversão base64: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na investigação:', error.message);
  } finally {
    await connection.end();
  }
}

debugLogoIssue();