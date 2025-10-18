import dotenv from 'dotenv';

dotenv.config();

async function testMaintenanceTypesAPI() {
  console.log('🧪 Testando API de Tipos de Manutenção...');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Teste GET - Listar tipos de manutenção
    console.log('\n📋 Testando GET /api/maintenance-types...');
    
    const response = await fetch(`${baseUrl}/api/maintenance-types`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ GET funcionando!');
      console.log(`📊 Encontrados ${data.length} tipos de manutenção:`);
      
      data.forEach((type, i) => {
        console.log(`  ${i + 1}. ID: ${type.id}, Nome: ${type.name}, Categoria: ${type.category}, Ativo: ${type.isActive}`);
      });
      
      return data;
    } else {
      console.error('❌ Erro no GET:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Resposta:', errorText);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
    return null;
  }
}

// Executar teste
testMaintenanceTypesAPI()
  .then((result) => {
    if (result) {
      console.log('\n✅ Teste da API concluído com sucesso!');
    } else {
      console.log('\n❌ Teste da API falhou!');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Falha no teste:', error);
    process.exit(1);
  });