import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function uploadLogo() {
  try {
    console.log('🔍 Fazendo upload do logo para o sistema...');
    
    // Caminho do logo SVG que já existe
    const logoPath = path.join(process.cwd(), 'public', 'uploads', 'logos', 'logo-fundo-saude.svg');
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(logoPath)) {
      console.error('❌ Arquivo de logo não encontrado:', logoPath);
      return;
    }
    
    console.log('✅ Logo encontrado:', logoPath);
    
    // Criar FormData
    const formData = new FormData();
    const logoBuffer = fs.readFileSync(logoPath);
    
    formData.append('logo', logoBuffer, {
      filename: 'logo-fundo-saude.svg',
      contentType: 'image/svg+xml'
    });
    
    // Fazer upload via API
    const response = await fetch('http://localhost:3000/api/pdf/logo', {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders()
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Logo enviado com sucesso!');
      console.log('📊 Resultado:', result);
    } else {
      console.error('❌ Erro no upload:', result);
    }
    
  } catch (error) {
    console.error('❌ Erro ao fazer upload do logo:', error);
  }
}

uploadLogo();