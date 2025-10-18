const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/equipment',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      console.log('=== ANÁLISE DOS DADOS DE SETORES E SUBSETORES ===');
      console.log('Resposta da API:', typeof response);
      console.log('Estrutura da resposta:', Object.keys(response));
      console.log('');
      
      // Verificar se a resposta tem uma propriedade que contém os equipamentos
      let equipments;
      if (Array.isArray(response)) {
        equipments = response;
      } else if (response.data && Array.isArray(response.data)) {
        equipments = response.data;
      } else if (response.equipments && Array.isArray(response.equipments)) {
        equipments = response.equipments;
      } else {
        console.log('Formato da resposta não reconhecido:', response);
        return;
      }
      
      console.log(`Total de equipamentos: ${equipments.length}`);
      console.log('');
      
      // Analisar setores
      const sectors = equipments.map(eq => eq.sector_name).filter(Boolean);
      const uniqueSectors = [...new Set(sectors)];
      console.log('SETORES ENCONTRADOS:');
      console.log('Todos os setores (com duplicatas):', sectors);
      console.log('Setores únicos:', uniqueSectors);
      console.log(`Total de setores únicos: ${uniqueSectors.length}`);
      console.log('');
      
      // Analisar subsetores
      const subsectors = equipments.map(eq => eq.subsector_name).filter(Boolean);
      const uniqueSubsectors = [...new Set(subsectors)];
      console.log('SUBSETORES ENCONTRADOS:');
      console.log('Todos os subsetores (com duplicatas):', subsectors);
      console.log('Subsetores únicos:', uniqueSubsectors);
      console.log(`Total de subsetores únicos: ${uniqueSubsectors.length}`);
      console.log('');
      
      // Verificar se há equipamentos sem setor ou subsetor
      const withoutSector = equipments.filter(eq => !eq.sector_name);
      const withoutSubsector = equipments.filter(eq => !eq.subsector_name);
      
      console.log('EQUIPAMENTOS SEM DADOS:');
      console.log(`Equipamentos sem setor: ${withoutSector.length}`);
      console.log(`Equipamentos sem subsetor: ${withoutSubsector.length}`);
      console.log('');
      
      // Mostrar alguns exemplos de equipamentos
      console.log('EXEMPLOS DE EQUIPAMENTOS (primeiros 3):');
      equipments.slice(0, 3).forEach((eq, index) => {
        console.log(`${index + 1}. ${eq.name}`);
        console.log(`   - Setor: "${eq.sector_name || 'N/A'}"`);
        console.log(`   - Subsetor: "${eq.subsector_name || 'N/A'}"`);
        console.log(`   - Sector ID: ${eq.sector_id || 'N/A'}`);
        console.log(`   - Subsector ID: ${eq.subsector_id || 'N/A'}`);
        console.log('');
      });
      
      // Verificar se há problemas de encoding
      console.log('VERIFICAÇÃO DE ENCODING:');
      uniqueSectors.forEach(sector => {
        if (sector && sector.includes('????')) {
          console.log(`⚠️  Setor com problema de encoding: "${sector}"`);
        }
      });
      uniqueSubsectors.forEach(subsector => {
        if (subsector && subsector.includes('????')) {
          console.log(`⚠️  Subsetor com problema de encoding: "${subsector}"`);
        }
      });
      
    } catch (error) {
      console.error('Erro ao processar dados:', error);
    }
  });
});

req.on('error', (error) => {
  console.error('Erro na requisição:', error);
});

req.end();