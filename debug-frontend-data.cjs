const http = require('http');
const url = require('url');

// Proxy server para interceptar requisições do frontend
const proxyServer = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  
  // Interceptar apenas requisições PUT para equipment
  if (req.method === 'PUT' && parsedUrl.pathname.includes('/api/equipment/')) {
    console.log('\n🔍 INTERCEPTANDO REQUISIÇÃO PUT PARA EQUIPMENT');
    console.log('URL:', req.url);
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      console.log('\n📦 DADOS ENVIADOS PELO FRONTEND:');
      try {
        const data = JSON.parse(body);
        console.log('Raw JSON:', body);
        console.log('Parsed Data:', JSON.stringify(data, null, 2));
        console.log('\n🔍 VERIFICANDO CAMPOS ESPECÍFICOS:');
        console.log('subsector_id:', data.subsector_id, '(tipo:', typeof data.subsector_id, ')');
        console.log('voltage:', data.voltage, '(tipo:', typeof data.voltage, ')');
        
        // Verificar se os campos estão presentes e não são undefined/null
        if (data.subsector_id === undefined || data.subsector_id === null) {
          console.log('❌ PROBLEMA: subsector_id está undefined/null');
        } else {
          console.log('✅ subsector_id está presente');
        }
        
        if (!data.voltage || data.voltage === '') {
          console.log('❌ PROBLEMA: voltage está vazio ou undefined');
        } else {
          console.log('✅ voltage está presente');
        }
        
      } catch (error) {
        console.log('❌ Erro ao parsear JSON:', error);
        console.log('Body raw:', body);
      }
      
      // Encaminhar a requisição para o servidor real
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: req.url,
        method: req.method,
        headers: req.headers
      };
      
      const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });
      
      proxyReq.write(body);
      proxyReq.end();
    });
  } else {
    // Para outras requisições, apenas encaminhar
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: req.url,
      method: req.method,
      headers: req.headers
    };
    
    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    
    req.pipe(proxyReq);
  }
});

proxyServer.listen(3001, () => {
  console.log('🔍 Proxy de debug rodando na porta 3001');
  console.log('Para testar, acesse: http://localhost:3001');
  console.log('Este proxy irá interceptar e logar todas as requisições PUT para /api/equipment/');
  console.log('\nPara usar:');
  console.log('1. Abra http://localhost:3001 no navegador');
  console.log('2. Navegue até a página de edição de equipamento');
  console.log('3. Faça alterações nos campos subsector_id e voltage');
  console.log('4. Salve o formulário');
  console.log('5. Observe os logs aqui no terminal');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando proxy de debug...');
  proxyServer.close(() => {
    console.log('✅ Proxy encerrado');
    process.exit(0);
  });
});