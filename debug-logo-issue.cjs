const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function debugLogoIssue() {
  console.log('🔍 INVESTIGAÇÃO COMPLETA DO PROBLEMA DO LOGO\n');
  
  let connection;
  try {
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'sistema_manutencao'
    });
    
    console.log('✅ Conectado ao banco de dados\n');
    
    // 1. Verificar configurações PDF
    console.log('1. 📋 VERIFICANDO CONFIGURAÇÕES PDF:');
    const [pdfSettings] = await connection.execute('SELECT * FROM pdf_settings LIMIT 1');
    if (pdfSettings.length > 0) {
      const settings = pdfSettings[0];
      console.log('   ✅ Configurações encontradas:');
      console.log(`   - Logo habilitado: ${settings.logo_enabled ? 'SIM' : 'NÃO'}`);
      console.log(`   - Header habilitado: ${settings.header_enabled ? 'SIM' : 'NÃO'}`);
      console.log(`   - Nome da empresa: ${settings.company_name || 'NÃO DEFINIDO'}`);
    } else {
      console.log('   ❌ Nenhuma configuração encontrada!');
    }
    console.log('');
    
    // 2. Verificar logos disponíveis
    console.log('2. 🖼️ VERIFICANDO LOGOS DISPONÍVEIS:');
    const [logos] = await connection.execute('SELECT * FROM logo_uploads WHERE is_active = TRUE ORDER BY uploaded_at DESC');
    console.log(`   ✅ ${logos.length} logo(s) ativo(s) encontrado(s):`);
    
    for (let i = 0; i < logos.length; i++) {
      const logo = logos[i];
      console.log(`   Logo ${i + 1}:`);
      console.log(`     - ID: ${logo.id}`);
      console.log(`     - Nome: ${logo.original_name}`);
      console.log(`     - Caminho: ${logo.file_path}`);
      console.log(`     - MIME: ${logo.mime_type}`);
      console.log(`     - Tamanho: ${logo.file_size} bytes`);
      
      // Verificar arquivo físico
      const fullPath = path.join(process.cwd(), 'public', logo.file_path);
      console.log(`     - Caminho completo: ${fullPath}`);
      console.log(`     - Arquivo existe: ${fs.existsSync(fullPath) ? 'SIM' : 'NÃO'}`);
      
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        console.log(`     - Tamanho no disco: ${stats.size} bytes`);
        console.log(`     - Última modificação: ${stats.mtime}`);
        
        // Testar conversão base64
        try {
          const imageBuffer = fs.readFileSync(fullPath);
          const base64Image = imageBuffer.toString('base64');
          console.log(`     - Conversão base64: SUCESSO (${base64Image.length} chars)`);
          console.log(`     - Primeiros 50 chars: ${base64Image.substring(0, 50)}...`);
        } catch (error) {
          console.log(`     - Conversão base64: ERRO - ${error.message}`);
        }
      }
      console.log('');
    }
    
    // 3. Simular processo de carregamento do logo
    console.log('3. 🔄 SIMULANDO PROCESSO DE CARREGAMENTO:');
    if (pdfSettings.length > 0 && pdfSettings[0].logo_enabled) {
      console.log('   ✅ Logo está habilitado nas configurações');
      
      const logoQuery = await connection.execute(
        'SELECT * FROM logo_uploads WHERE is_active = TRUE ORDER BY uploaded_at DESC LIMIT 1'
      );
      
      if (logoQuery[0].length > 0) {
        const logo = logoQuery[0][0];
        console.log('   ✅ Logo encontrado na query:', logo.original_name);
        
        const logoPath = path.join(process.cwd(), 'public', logo.file_path);
        console.log('   📁 Caminho do logo:', logoPath);
        
        if (fs.existsSync(logoPath)) {
          console.log('   ✅ Arquivo existe fisicamente');
          
          try {
            const imageBuffer = fs.readFileSync(logoPath);
            const base64Image = imageBuffer.toString('base64');
            
            // Detectar tipo MIME
            let mimeType = 'image/png';
            if (logo.file_path.endsWith('.png')) {
              mimeType = 'image/png';
            } else if (logo.file_path.endsWith('.jpg') || logo.file_path.endsWith('.jpeg')) {
              mimeType = 'image/jpeg';
            } else if (logo.file_path.endsWith('.svg')) {
              mimeType = 'image/svg+xml';
            }
            
            const logoImage = `data:${mimeType};base64,${base64Image}`;
            console.log('   ✅ Logo carregado com sucesso!');
            console.log(`   - Tipo MIME: ${mimeType}`);
            console.log(`   - Tamanho base64: ${base64Image.length} caracteres`);
            console.log(`   - Data URL válida: ${logoImage.startsWith('data:') ? 'SIM' : 'NÃO'}`);
            
            // Verificar se é SVG válido
            if (mimeType === 'image/svg+xml') {
              const svgContent = imageBuffer.toString('utf8');
              console.log(`   - Conteúdo SVG válido: ${svgContent.includes('<svg') ? 'SIM' : 'NÃO'}`);
              console.log(`   - Primeiros 100 chars do SVG: ${svgContent.substring(0, 100)}...`);
            }
            
          } catch (error) {
            console.log('   ❌ Erro ao processar logo:', error.message);
          }
        } else {
          console.log('   ❌ Arquivo não existe fisicamente!');
        }
      } else {
        console.log('   ❌ Nenhum logo ativo encontrado na query');
      }
    } else {
      console.log('   ❌ Logo está DESABILITADO nas configurações');
    }
    
    console.log('\n4. 🎯 DIAGNÓSTICO FINAL:');
    
    // Verificar possíveis problemas
    const issues = [];
    
    if (pdfSettings.length === 0) {
      issues.push('Tabela pdf_settings está vazia');
    } else if (!pdfSettings[0].logo_enabled) {
      issues.push('Logo está desabilitado nas configurações');
    }
    
    if (logos.length === 0) {
      issues.push('Nenhum logo ativo encontrado');
    }
    
    const activeLogo = logos.length > 0 ? logos[0] : null;
    if (activeLogo) {
      const logoPath = path.join(process.cwd(), 'public', activeLogo.file_path);
      if (!fs.existsSync(logoPath)) {
        issues.push('Arquivo de logo não existe fisicamente');
      }
    }
    
    if (issues.length > 0) {
      console.log('   ❌ PROBLEMAS ENCONTRADOS:');
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    } else {
      console.log('   ✅ Todas as verificações passaram - logo deveria aparecer!');
      console.log('   🤔 Problema pode estar na renderização do jsPDF com SVG');
    }
    
  } catch (error) {
    console.error('💥 Erro durante investigação:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugLogoIssue();