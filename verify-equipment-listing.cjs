const https = require('https');
const http = require('http');

console.log('🔍 Verificando se o equipamento aparece na listagem...');

// Fazer requisição para listar todos os equipamentos
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/equipment',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const equipments = JSON.parse(data);
      
      console.log(`📊 Total de equipamentos encontrados: ${equipments.length}`);
      
      // Procurar pelo equipamento de teste
      const testEquipment = equipments.find(eq => 
        eq.name === 'Ventilador Pulmonar Teste' && 
        eq.brand === 'MedTech' && 
        eq.model === 'VP-2000-TEST'
      );
      
      if (testEquipment) {
        console.log('✅ Equipamento de teste encontrado na listagem!');
        console.log('📋 Dados do equipamento na listagem:');
        console.log(`   - ID: ${testEquipment.id}`);
        console.log(`   - Código: ${testEquipment.code}`);
        console.log(`   - Nome: ${testEquipment.name}`);
        console.log(`   - Marca: ${testEquipment.brand}`);
        console.log(`   - Modelo: ${testEquipment.model}`);
        console.log(`   - Número de Série: ${testEquipment.serial_number}`);
        console.log(`   - Setor: ${testEquipment.sector_name}`);
        console.log(`   - Categoria: ${testEquipment.category_name}`);
        console.log(`   - Subsetor: ${testEquipment.subsector_name}`);
        console.log(`   - Status: ${testEquipment.status}`);
        console.log(`   - Ativo: ${testEquipment.is_active ? 'Sim' : 'Não'}`);
        
        console.log('\n🎉 SUCESSO: O equipamento cadastrado aparece corretamente na listagem!');
      } else {
        console.log('❌ Equipamento de teste NÃO encontrado na listagem.');
        console.log('📋 Equipamentos disponíveis:');
        equipments.slice(0, 3).forEach((eq, index) => {
          console.log(`   ${index + 1}. ${eq.name} (${eq.brand} - ${eq.model})`);
        });
        if (equipments.length > 3) {
          console.log(`   ... e mais ${equipments.length - 3} equipamentos`);
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao processar resposta:', error.message);
      console.log('📄 Resposta bruta:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message);
});

req.end();