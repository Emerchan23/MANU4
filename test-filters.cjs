// Usando fetch nativo do Node.js 18+

// Função para testar os filtros de setor e subsetor
async function testFilters() {
  try {
    console.log('🧪 Testando filtros de setor e subsetor...');
    
    // Buscar equipamentos
    const response = await fetch('http://localhost:3000/api/equipments');
    const data = await response.json();
    
    if (!data.success) {
      console.error('❌ Erro ao buscar equipamentos:', data.error);
      return;
    }
    
    const equipments = data.data;
    console.log(`📊 Total de equipamentos: ${equipments.length}`);
    
    // Extrair setores únicos
    const sectors = equipments.map(eq => eq.sector_name).filter(Boolean);
    const uniqueSectors = [...new Set(sectors)];
    console.log('🏢 Setores únicos encontrados:', uniqueSectors);
    
    // Extrair subsetores únicos
    const subsectors = equipments.map(eq => eq.subsector_name).filter(Boolean);
    const uniqueSubsectors = [...new Set(subsectors)];
    console.log('🏬 Subsetores únicos encontrados:', uniqueSubsectors);
    
    // Testar filtro por setor
    console.log('\n🔍 Testando filtro por setor:');
    uniqueSectors.forEach(sector => {
      const filtered = equipments.filter(eq => eq.sector_name === sector);
      console.log(`  - Setor "${sector}": ${filtered.length} equipamentos`);
    });
    
    // Testar filtro por subsetor
    console.log('\n🔍 Testando filtro por subsetor:');
    uniqueSubsectors.forEach(subsector => {
      const filtered = equipments.filter(eq => eq.subsector_name === subsector);
      console.log(`  - Subsetor "${subsector}": ${filtered.length} equipamentos`);
    });
    
    // Testar combinação de filtros
    console.log('\n🔍 Testando combinação de filtros:');
    uniqueSectors.forEach(sector => {
      const sectorEquipments = equipments.filter(eq => eq.sector_name === sector);
      const sectorSubsectors = [...new Set(sectorEquipments.map(eq => eq.subsector_name).filter(Boolean))];
      
      if (sectorSubsectors.length > 0) {
        console.log(`  - Setor "${sector}" tem subsetores: ${sectorSubsectors.join(', ')}`);
        
        sectorSubsectors.forEach(subsector => {
          const combinedFiltered = equipments.filter(eq => 
            eq.sector_name === sector && eq.subsector_name === subsector
          );
          console.log(`    → Setor "${sector}" + Subsetor "${subsector}": ${combinedFiltered.length} equipamentos`);
        });
      }
    });
    
    // Verificar equipamentos sem setor ou subsetor
    const withoutSector = equipments.filter(eq => !eq.sector_name);
    const withoutSubsector = equipments.filter(eq => !eq.subsector_name);
    
    console.log('\n📋 Equipamentos sem classificação:');
    console.log(`  - Sem setor: ${withoutSector.length} equipamentos`);
    console.log(`  - Sem subsetor: ${withoutSubsector.length} equipamentos`);
    
    console.log('\n✅ Teste de filtros concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar o teste
testFilters();