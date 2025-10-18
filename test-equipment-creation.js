// Usando fetch nativo do Node.js 18+

async function testEquipmentCreation() {
  try {
    console.log('🧪 Testando criação de equipamento...');
    
    const equipmentData = {
      name: "Ventilador Pulmonar Teste",
      manufacturer: "Philips",
      model: "V60",
      serial_number: "VP123456",
      sector_id: 4, // Enfermagem
      category_id: 1, // Equipamentos Respiratórios
      subsector_id: null,
      installation_date: "2024-01-15",
      warranty_expiry: "2027-01-15",
      maintenance_frequency_days: 180,
      observations: "Ventilador pulmonar com modo CPAP e BiPAP"
    };
    
    console.log('📤 Enviando dados:', JSON.stringify(equipmentData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/equipment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(equipmentData)
    });
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 Resposta bruta:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('📦 Dados da resposta:', JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.log('❌ Erro ao fazer parse da resposta JSON:', parseError.message);
    }
    
    if (response.ok) {
      console.log('✅ Equipamento criado com sucesso!');
      console.log('🆔 ID do equipamento:', responseData?.id);
    } else {
      console.log('❌ Erro ao criar equipamento');
      console.log('📄 Detalhes do erro:', responseData || responseText);
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    console.error('📋 Stack trace:', error.stack);
  }
}

testEquipmentCreation();