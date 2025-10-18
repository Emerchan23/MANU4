const fetch = require('node-fetch');

async function testDeleteAPI() {
  try {
    console.log('🧪 Testando DELETE API...');
    
    // Primeiro, vamos testar se a API está respondendo
    console.log('1. Testando GET /api/companies...');
    const getResponse = await fetch('http://localhost:3000/api/companies');
    console.log('GET Status:', getResponse.status);
    
    if (getResponse.ok) {
      const companies = await getResponse.json();
      console.log('Empresas encontradas:', companies.length);
      
      if (companies.length > 0) {
        const testCompany = companies[0];
        console.log('Empresa de teste:', testCompany.name, 'ID:', testCompany.id);
        
        // Agora vamos testar o DELETE
        console.log('\n2. Testando DELETE /api/companies...');
        const deleteResponse = await fetch(`http://localhost:3000/api/companies?id=${testCompany.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('DELETE Status:', deleteResponse.status);
        console.log('DELETE Headers:', Object.fromEntries(deleteResponse.headers.entries()));
        
        const deleteResult = await deleteResponse.text();
        console.log('DELETE Response:', deleteResult);
        
        if (deleteResponse.ok) {
          console.log('✅ DELETE funcionou!');
        } else {
          console.log('❌ DELETE falhou');
        }
      } else {
        console.log('Nenhuma empresa encontrada para testar');
      }
    } else {
      console.log('❌ GET falhou');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testDeleteAPI();