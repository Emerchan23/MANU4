const fetch = require('node-fetch');

async function testSectorDelete() {
  try {
    console.log('🧪 Testando DELETE de setores...');
    
    // Primeiro buscar setores existentes
    const getResponse = await fetch('http://localhost:3000/api/sectors');
    console.log('GET Status:', getResponse.status);
    
    if (getResponse.ok) {
      const sectors = await getResponse.json();
      console.log('Setores encontrados:', sectors.length);
      
      if (sectors.length > 0) {
        const testSector = sectors[0];
        console.log('Setor de teste:', testSector.name, 'ID:', testSector.id);
        
        // Testar DELETE
        console.log('\n2. Testando DELETE /api/sectors...');
        const deleteResponse = await fetch(`http://localhost:3000/api/sectors?id=${testSector.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('DELETE Status:', deleteResponse.status);
        const deleteResult = await deleteResponse.text();
        console.log('DELETE Response:', deleteResult);
        
        if (deleteResponse.ok) {
          console.log('✅ DELETE funcionou!');
        } else {
          console.log('❌ DELETE falhou');
        }
      } else {
        console.log('Nenhum setor encontrado para testar');
      }
    } else {
      console.log('❌ GET falhou');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testSectorDelete();