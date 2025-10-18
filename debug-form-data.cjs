// Script para interceptar e logar dados do formulário de equipamentos
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Prepare the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      
      // Interceptar requisições PUT para /api/equipment/
      if (req.method === 'PUT' && req.url.includes('/api/equipment/')) {
        console.log('\n🔍 INTERCEPTANDO REQUISIÇÃO PUT para equipamento:');
        console.log('URL:', req.url);
        console.log('Method:', req.method);
        console.log('Headers:', req.headers);
        
        // Capturar o body da requisição
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', () => {
          console.log('\n📦 DADOS ENVIADOS:');
          try {
            const data = JSON.parse(body);
            console.log('Dados completos:', JSON.stringify(data, null, 2));
            console.log('\n🔍 CAMPOS ESPECÍFICOS:');
            console.log('subsector_id:', data.subsector_id, '(tipo:', typeof data.subsector_id, ')');
            console.log('voltage:', data.voltage, '(tipo:', typeof data.voltage, ')');
            console.log('sector_id:', data.sector_id, '(tipo:', typeof data.sector_id, ')');
            console.log('category_id:', data.category_id, '(tipo:', typeof data.category_id, ')');
            
            // Verificar se os campos estão presentes e válidos
            if (data.subsector_id === null || data.subsector_id === undefined || data.subsector_id === '') {
              console.log('⚠️  PROBLEMA: subsector_id está vazio/nulo!');
            }
            if (data.voltage === null || data.voltage === undefined || data.voltage === '') {
              console.log('⚠️  PROBLEMA: voltage está vazio/nulo!');
            }
            
            console.log('\n' + '='.repeat(50));
          } catch (e) {
            console.log('Erro ao parsear JSON:', e.message);
            console.log('Body raw:', body);
          }
        });
      }
      
      // Continuar com o processamento normal do Next.js
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
  .once('error', (err) => {
    console.error(err);
    process.exit(1);
  })
  .listen(port, () => {
    console.log(`🚀 Servidor com debug rodando em http://${hostname}:${port}`);
    console.log('🔍 Monitorando requisições PUT para /api/equipment/');
    console.log('\nPara testar:');
    console.log('1. Acesse http://localhost:3000');
    console.log('2. Vá para a página de edição de equipamento');
    console.log('3. Modifique os campos subsetor e voltagem');
    console.log('4. Salve o formulário');
    console.log('5. Observe os logs aqui\n');
  });
});