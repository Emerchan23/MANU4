// Script para debugar os dados enviados pelo frontend
const testData = {
  patrimonioNumber: '656546',
  name: '4564564',
  model: '4564546',
  brand: '5465654954',
  serialNumber: '56454',
  categoryId: '3333',
  sectorId: '444',
  subsectorId: '444',
  voltage: ''
};

console.log('=== DADOS DO FORMULÁRIO ===');
console.log('Dados originais:', testData);

// Simular o processamento do handleAddEquipment
const categoryId = testData.categoryId;
const sectorId = testData.sectorId;
const subsectorId = testData.subsectorId;
const voltage = testData.voltage;

console.log('\n=== EXTRAÇÃO DE DADOS ===');
console.log('categoryId:', categoryId);
console.log('sectorId:', sectorId);
console.log('subsectorId:', subsectorId);
console.log('voltage:', voltage);

// Simular categories e subsectors vazios (como pode estar acontecendo)
const categories = [];
const subsectors = [];

const category = categories.find(c => c.id === categoryId);
const subsector = subsectors.find(s => s.id === subsectorId);

console.log('\n=== BUSCA DE ENTIDADES ===');
console.log('category encontrada:', category);
console.log('subsector encontrado:', subsector);

// Criar specifications
const specifications = {
  patrimonio: testData.patrimonioNumber,
  categoria: category?.name || categoryId,
  voltagem: voltage || null,
  subsetor: subsector?.name || subsectorId
};

console.log('\n=== SPECIFICATIONS ===');
console.log('specifications:', specifications);

// Criar apiData
const apiData = {
  name: testData.name,
  model: testData.model,
  serial_number: testData.serialNumber,
  brand: testData.brand,
  sector_id: parseInt(sectorId),
  category_id: isNaN(parseInt(categoryId)) ? null : parseInt(categoryId),
  subsector_id: isNaN(parseInt(subsectorId)) ? null : parseInt(subsectorId),
  specifications: JSON.stringify(specifications)
};

console.log('\n=== DADOS PARA API ===');
console.log('apiData completo:', apiData);
console.log('apiData JSON:', JSON.stringify(apiData, null, 2));

// Verificar se há algum problema com os tipos
console.log('\n=== VERIFICAÇÃO DE TIPOS ===');
console.log('typeof sectorId:', typeof sectorId);
console.log('parseInt(sectorId):', parseInt(sectorId));
console.log('isNaN(parseInt(categoryId)):', isNaN(parseInt(categoryId)));
console.log('isNaN(parseInt(subsectorId)):', isNaN(parseInt(subsectorId)));