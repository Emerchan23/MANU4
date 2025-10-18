const https = require('https');
const http = require('http');

const testEquipmentAPI = async () => {
  console.log('🔍 Testando API de equipamentos...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/equipment',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('📊 Status da resposta:', res.statusCode);
          console.log('📊 Dados recebidos:', response.success);
          
          if (response.success && response.data) {
            console.log('📊 Total de equipamentos:', response.data.length);
            
            // Verificar setores únicos
            const sectors = response.data.map(eq => eq.sector_name).filter(Boolean);
            const uniqueSectors = [...new Set(sectors)];
            console.log('🏢 Setores únicos encontrados:', uniqueSectors);
            
            // Verificar subsetores únicos
            const subsectors = response.data.map(eq => eq.subsector_name).filter(Boolean);
            const uniqueSubsectors = [...new Set(subsectors)];
            console.log('🏢 Subsetores únicos encontrados:', uniqueSubsectors);
            
            // Mostrar alguns exemplos
            console.log('\n📋 Primeiros 3 equipamentos:');
            response.data.slice(0, 3).forEach((eq, index) => {
              console.log(`${index + 1}. ${eq.name}`);
              console.log(`   Setor: ${eq.sector_name || 'N/A'}`);
              console.log(`   Subsetor: ${eq.subsector_name || 'N/A'}`);
              console.log('---');
            });
          }
          
          resolve(response);
        } catch (error) {
          console.error('❌ Erro ao parsear JSON:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Erro na requisição:', error);
      reject(error);
    });
    
    req.end();
  });
};

testEquipmentAPI().catch(console.error);