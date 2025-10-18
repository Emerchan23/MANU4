const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function debugLogoFinalComplete() {
  console.log('🔧 DEBUG COMPLETO DO PROBLEMA DO LOGO NO PDF - VERSÃO FINAL\n');
  
  let connection;
  try {
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados\n');
    
    // 1. VERIFICAR CONFIGURAÇÕES PDF
    console.log('1. 📋 VERIFICANDO CONFIGURAÇÕES PDF:');
    const [settings] = await connection.execute('SELECT * FROM pdf_settings LIMIT 1');
    if (settings.length > 0) {
      const config = settings[0];
      console.log('   Configurações encontradas:');
      console.log(`   - pdf_logo_enabled: ${config.pdf_logo_enabled}`);
      console.log(`   - pdf_company_name: ${config.pdf_company_name}`);
      console.log(`   - pdf_header_enabled: ${config.pdf_header_enabled}`);
      
      if (!config.pdf_logo_enabled) {
        console.log('   ❌ PROBLEMA: Logo está DESABILITADO nas configurações!');
      } else {
        console.log('   ✅ Logo está habilitado nas configurações');
      }
    } else {
      console.log('   ❌ PROBLEMA: Nenhuma configuração PDF encontrada!');
    }
    console.log('');
    
    // 2. VERIFICAR LOGOS DISPONÍVEIS
    console.log('2. 🖼️ VERIFICANDO LOGOS DISPONÍVEIS:');
    const [logos] = await connection.execute('SELECT * FROM logo_uploads WHERE is_active = TRUE ORDER BY uploaded_at DESC');
    console.log(`   Total de logos ativos: ${logos.length}`);
    
    if (logos.length === 0) {
      console.log('   ❌ PROBLEMA: Nenhum logo ativo encontrado!');
    } else {
      logos.forEach((logo, index) => {
        console.log(`   Logo ${index + 1}:`);
        console.log(`   - ID: ${logo.id}`);
        console.log(`   - Nome: ${logo.original_name}`);
        console.log(`   - Caminho: ${logo.file_path}`);
        console.log(`   - MIME: ${logo.mime_type}`);
        console.log(`   - Tamanho: ${logo.file_size} bytes`);
        console.log(`   - Upload: ${logo.uploaded_at}`);
        console.log('');
      });
    }
    
    // 3. VERIFICAR ARQUIVOS FÍSICOS
    console.log('3. 📁 VERIFICANDO ARQUIVOS FÍSICOS:');
    if (logos.length > 0) {
      const logo = logos[0]; // Pegar o primeiro logo
      const logoPath = path.join(process.cwd(), 'public', logo.file_path);
      
      console.log(`   Caminho completo: ${logoPath}`);
      console.log(`   Arquivo existe: ${fs.existsSync(logoPath) ? 'SIM' : 'NÃO'}`);
      
      if (fs.existsSync(logoPath)) {
        const stats = fs.statSync(logoPath);
        console.log(`   Tamanho no disco: ${stats.size} bytes`);
        console.log(`   Última modificação: ${stats.mtime}`);
        
        // 4. TESTAR CONVERSÃO BASE64
        console.log('\n4. 🔄 TESTANDO CONVERSÃO BASE64:');
        try {
          const imageBuffer = fs.readFileSync(logoPath);
          const base64Image = imageBuffer.toString('base64');
          
          console.log(`   Base64 gerado: ${base64Image.length} caracteres`);
          console.log(`   Primeiros 100 chars: ${base64Image.substring(0, 100)}...`);
          
          // Detectar MIME type
          let mimeType = 'image/png';
          if (logo.file_path.endsWith('.png')) {
            mimeType = 'image/png';
          } else if (logo.file_path.endsWith('.jpg') || logo.file_path.endsWith('.jpeg')) {
            mimeType = 'image/jpeg';
          } else if (logo.file_path.endsWith('.svg')) {
            mimeType = 'image/svg+xml';
          }
          
          const dataUrl = `data:${mimeType};base64,${base64Image}`;
          console.log(`   MIME Type detectado: ${mimeType}`);
          console.log(`   Data URL: ${dataUrl.substring(0, 100)}...`);
          
          // 5. SIMULAR PROCESSO DO PDF
          console.log('\n5. 🎯 SIMULANDO PROCESSO DO PDF:');
          console.log('   Configurações:');
          console.log(`   - Logo habilitado: ${settings[0]?.pdf_logo_enabled ? 'SIM' : 'NÃO'}`);
          console.log(`   - Logo encontrado: ${logos.length > 0 ? 'SIM' : 'NÃO'}`);
          console.log(`   - Arquivo existe: ${fs.existsSync(logoPath) ? 'SIM' : 'NÃO'}`);
          console.log(`   - Base64 válido: ${base64Image.length > 0 ? 'SIM' : 'NÃO'}`);
          
          // Verificar se é SVG
          if (mimeType === 'image/svg+xml') {
            console.log('   ⚠️ ATENÇÃO: Logo é SVG - jsPDF pode ter problemas!');
            
            // Ler conteúdo SVG
            const svgContent = fs.readFileSync(logoPath, 'utf8');
            console.log(`   Conteúdo SVG (primeiros 200 chars): ${svgContent.substring(0, 200)}...`);
            
            // Verificar se SVG é válido
            if (svgContent.includes('<svg') && svgContent.includes('</svg>')) {
              console.log('   ✅ SVG parece válido');
            } else {
              console.log('   ❌ SVG pode estar corrompido');
            }
          }
          
        } catch (error) {
          console.error('   ❌ ERRO na conversão base64:', error.message);
        }
      } else {
        console.log('   ❌ PROBLEMA: Arquivo físico não encontrado!');
      }
    }
    
    // 6. DIAGNÓSTICO FINAL
    console.log('\n6. 🏥 DIAGNÓSTICO FINAL:');
    
    const problems = [];
    const solutions = [];
    
    if (settings.length === 0) {
      problems.push('Configurações PDF não encontradas');
      solutions.push('Executar script de criação das configurações');
    }
    
    if (settings.length > 0 && !settings[0].pdf_logo_enabled) {
      problems.push('Logo desabilitado nas configurações');
      solutions.push('Habilitar logo nas configurações PDF');
    }
    
    if (logos.length === 0) {
      problems.push('Nenhum logo ativo no banco');
      solutions.push('Fazer upload de um logo válido');
    }
    
    if (logos.length > 0) {
      const logo = logos[0];
      const logoPath = path.join(process.cwd(), 'public', logo.file_path);
      
      if (!fs.existsSync(logoPath)) {
        problems.push('Arquivo físico do logo não encontrado');
        solutions.push('Verificar caminho do arquivo ou fazer novo upload');
      }
      
      if (logo.mime_type === 'image/svg+xml') {
        problems.push('Logo é SVG - jsPDF tem problemas com SVG');
        solutions.push('Converter logo para PNG ou implementar conversão SVG→PNG');
      }
    }
    
    if (problems.length === 0) {
      console.log('   ✅ NENHUM PROBLEMA DETECTADO - Logo deveria funcionar!');
      console.log('   🔍 Problema pode estar na implementação do jsPDF');
    } else {
      console.log('   ❌ PROBLEMAS DETECTADOS:');
      problems.forEach((problem, index) => {
        console.log(`   ${index + 1}. ${problem}`);
      });
      
      console.log('\n   🔧 SOLUÇÕES RECOMENDADAS:');
      solutions.forEach((solution, index) => {
        console.log(`   ${index + 1}. ${solution}`);
      });
    }
    
  } catch (error) {
    console.error('💥 Erro durante debug:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugLogoFinalComplete().catch(console.error);