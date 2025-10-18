const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function testLogoConversion() {
  console.log('🧪 TESTANDO CONVERSÃO E RENDERIZAÇÃO DO LOGO - VERSÃO ATUALIZADA\n');
  
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
    
    // Buscar logo ativo
    const [logos] = await connection.execute(
      'SELECT * FROM logo_uploads WHERE is_active = TRUE ORDER BY uploaded_at DESC LIMIT 1'
    );
    
    if (logos.length === 0) {
      console.log('❌ Nenhum logo ativo encontrado');
      return;
    }
    
    const logo = logos[0];
    console.log('🖼️ Logo encontrado:', logo.original_name);
    console.log('📁 Caminho:', logo.file_path);
    
    const logoPath = path.join(process.cwd(), 'public', logo.file_path);
    console.log('📍 Caminho completo:', logoPath);
    
    if (!fs.existsSync(logoPath)) {
      console.log('❌ Arquivo não existe!');
      return;
    }
    
    // Ler arquivo SVG
    const svgContent = fs.readFileSync(logoPath, 'utf8');
    console.log('📄 Conteúdo SVG:');
    console.log(svgContent);
    console.log('');
    
    // Testar conversão base64
    const imageBuffer = fs.readFileSync(logoPath);
    const base64Image = imageBuffer.toString('base64');
    
    console.log('🔄 Conversão base64:');
    console.log(`- Tamanho: ${base64Image.length} caracteres`);
    console.log(`- Primeiros 100 chars: ${base64Image.substring(0, 100)}...`);
    console.log('');
    
    // Criar data URL
    const dataUrl = `data:image/svg+xml;base64,${base64Image}`;
    console.log('🌐 Data URL criada:');
    console.log(`- Tamanho total: ${dataUrl.length} caracteres`);
    console.log(`- Válida: ${dataUrl.startsWith('data:image/svg+xml;base64,') ? 'SIM' : 'NÃO'}`);
    console.log('');
    
    // Verificar se SVG é válido
    const isValidSvg = svgContent.includes('<svg') && svgContent.includes('</svg>');
    console.log('✅ Validações:');
    console.log(`- SVG válido: ${isValidSvg ? 'SIM' : 'NÃO'}`);
    console.log(`- Tem viewBox: ${svgContent.includes('viewBox') ? 'SIM' : 'NÃO'}`);
    console.log(`- Tem dimensões: ${svgContent.includes('width=') && svgContent.includes('height=') ? 'SIM' : 'NÃO'}`);
    console.log('');
    
    // Criar uma versão PNG simples para teste
    console.log('🎨 CRIANDO LOGO PNG PARA TESTE...');
    
    // Criar um PNG simples usando Canvas (se disponível) ou criar um placeholder
    const pngPath = path.join(process.cwd(), 'public', 'uploads', 'logos', 'test-logo.png');
    
    // Como não temos canvas no Node.js, vamos criar um PNG base64 simples
    // Este é um PNG 1x1 transparente para teste
    const simplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
    const pngBuffer = Buffer.from(simplePngBase64, 'base64');
    
    // Salvar PNG de teste
    fs.writeFileSync(pngPath, pngBuffer);
    console.log(`✅ PNG de teste criado: ${pngPath}`);
    
    // Inserir PNG na base de dados para teste
    await connection.execute(`
      INSERT INTO logo_uploads (original_name, file_path, mime_type, file_size, is_active, uploaded_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, ['test-logo.png', '/uploads/logos/test-logo.png', 'image/png', pngBuffer.length, true]);
    
    console.log('✅ PNG inserido na base de dados');
    
    // Desativar logos SVG temporariamente
    await connection.execute('UPDATE logo_uploads SET is_active = FALSE WHERE mime_type = ?', ['image/svg+xml']);
    console.log('⚠️ Logos SVG temporariamente desativados');
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Testar geração de PDF com PNG');
    console.log('2. Se PNG funcionar, problema é com SVG no jsPDF');
    console.log('3. Se PNG não funcionar, problema é no código de renderização');
    
  } catch (error) {
    console.error('💥 Erro:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testLogoConversion();