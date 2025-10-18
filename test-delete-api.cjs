const mysql = require('mysql2/promise');

async function testDeleteAPI() {
  try {
    console.log('Testando DELETE API endpoint...');
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance',
    });

    // Primeiro, vamos verificar se o ID 9 existe
    const [existing] = await connection.execute(
      'SELECT id, name FROM service_description_templates WHERE id = ?',
      [9]
    );

    if (existing.length === 0) {
      console.log('❌ Template com ID 9 não encontrado no banco de dados');
    } else {
      console.log('✅ Template encontrado:', existing[0]);
      
      // Verificar dependências
      const [dependencies] = await connection.execute(
        'SELECT COUNT(*) as count FROM service_orders WHERE template_id = ?',
        [9]
      );
      
      console.log(`Dependências encontradas: ${dependencies[0].count}`);
      
      if (dependencies[0].count > 0) {
        console.log('⚠️ Template tem dependências - não pode ser excluído');
      } else {
        console.log('✅ Template pode ser excluído');
      }
    }

    await connection.end();
    
    // Agora vamos testar a API diretamente
    console.log('\nTestando API endpoint...');
    
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/service-templates/9',
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      console.log('Status da resposta:', res.statusCode);
      console.log('Headers da resposta:', res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Resposta da API:', data);
        try {
          const jsonResponse = JSON.parse(data);
          console.log('Resposta JSON:', jsonResponse);
        } catch (e) {
          console.log('Resposta não é JSON válido');
        }
      });
    });

    req.on('error', (e) => {
      console.error('Erro na requisição:', e.message);
    });

    req.end();

  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testDeleteAPI();