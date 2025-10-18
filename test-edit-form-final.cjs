const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function testEditFormData() {
  console.log('🔍 TESTE FINAL DO FORMULÁRIO DE EDIÇÃO DE AGENDAMENTOS\n');

  try {
    // 1. Testar API de agendamento específico
    console.log('📋 1. TESTANDO API /api/maintenance-schedules/8');
    const scheduleResponse = await fetch(`${BASE_URL}/api/maintenance-schedules/8`);
    const scheduleData = await scheduleResponse.json();
    
    console.log('   ✅ Status:', scheduleResponse.status);
    console.log('   📊 Dados do agendamento:');
    console.log('      ID:', scheduleData.data?.id);
    console.log('      Equipment ID:', scheduleData.data?.equipment_id);
    console.log('      Company ID:', scheduleData.data?.company_id);
    console.log('      Company Name:', scheduleData.data?.company_name);
    console.log('      Assigned User ID:', scheduleData.data?.assigned_user_id);
    console.log('      Assigned User Name:', scheduleData.data?.assigned_user_name);
    console.log('      Maintenance Type:', scheduleData.data?.maintenance_type);
    console.log('      Status:', scheduleData.data?.status);
    console.log('      Estimated Cost:', scheduleData.data?.estimated_cost);
    console.log('      Observations:', scheduleData.data?.observations);
    console.log('      Maintenance Plan ID:', scheduleData.data?.maintenance_plan_id);

    console.log('\n');

    // 2. Testar API de empresas
    console.log('🏢 2. TESTANDO API /api/companies');
    const companiesResponse = await fetch(`${BASE_URL}/api/companies`);
    const companiesData = await companiesResponse.json();
    
    console.log('   ✅ Status:', companiesResponse.status);
    console.log('   📊 Total de empresas:', companiesData.data?.length || 0);
    if (companiesData.data && companiesData.data.length > 0) {
      console.log('   📋 Primeira empresa:');
      console.log('      ID:', companiesData.data[0].id);
      console.log('      Nome:', companiesData.data[0].name);
    }

    console.log('\n');

    // 3. Testar API de usuários
    console.log('👤 3. TESTANDO API /api/users');
    const usersResponse = await fetch(`${BASE_URL}/api/users`);
    const usersData = await usersResponse.json();
    
    console.log('   ✅ Status:', usersResponse.status);
    console.log('   📊 Total de usuários:', Array.isArray(usersData) ? usersData.length : 0);
    if (Array.isArray(usersData) && usersData.length > 0) {
      console.log('   📋 Primeiro usuário:');
      console.log('      ID:', usersData[0].id);
      console.log('      Nome:', usersData[0].name);
      console.log('      Username:', usersData[0].username);
    }

    console.log('\n');

    // 4. Testar API de tipos de manutenção
    console.log('🔧 4. TESTANDO API /api/maintenance-types');
    const typesResponse = await fetch(`${BASE_URL}/api/maintenance-types`);
    const typesData = await typesResponse.json();
    
    console.log('   ✅ Status:', typesResponse.status);
    console.log('   📊 Total de tipos:', typesData.data?.length || 0);
    if (typesData.data && typesData.data.length > 0) {
      console.log('   📋 Primeiro tipo:');
      console.log('      ID:', typesData.data[0].id);
      console.log('      Nome:', typesData.data[0].nome);
    }

    console.log('\n');

    // 5. Verificar se todos os dados necessários estão disponíveis
    console.log('✅ 5. VERIFICAÇÃO FINAL DOS DADOS PARA O FORMULÁRIO');
    
    const hasScheduleData = scheduleData.success && scheduleData.data;
    const hasCompanies = companiesData.success && companiesData.data && companiesData.data.length > 0;
    const hasUsers = Array.isArray(usersData) && usersData.length > 0;
    const hasMaintenanceTypes = typesData.success && typesData.data && typesData.data.length > 0;

    console.log('   📊 Dados do agendamento:', hasScheduleData ? '✅ OK' : '❌ FALTANDO');
    console.log('   🏢 Empresas:', hasCompanies ? '✅ OK' : '❌ FALTANDO');
    console.log('   👤 Usuários:', hasUsers ? '✅ OK' : '❌ FALTANDO');
    console.log('   🔧 Tipos de manutenção:', hasMaintenanceTypes ? '✅ OK' : '❌ FALTANDO');

    console.log('\n');

    // 6. Simular preenchimento do formulário
    console.log('📝 6. SIMULAÇÃO DE PREENCHIMENTO DO FORMULÁRIO');
    
    if (hasScheduleData) {
      const formData = {
        equipment_id: scheduleData.data.equipment_id?.toString() || '',
        maintenance_type: scheduleData.data.maintenance_type || '',
        description: scheduleData.data.description || '',
        scheduled_date: scheduleData.data.scheduled_date || '',
        priority: scheduleData.data.priority || 'medium',
        assigned_user_id: scheduleData.data.assigned_user_id?.toString() || '',
        estimated_cost: scheduleData.data.estimated_cost?.toString() || '',
        status: scheduleData.data.status || 'pending',
        maintenance_plan_id: scheduleData.data.maintenance_plan_id?.toString() || '',
        company_id: scheduleData.data.company_id?.toString() || '',
        observations: scheduleData.data.observations || ''
      };

      console.log('   📋 FormData simulado:');
      Object.entries(formData).forEach(([key, value]) => {
        console.log(`      ${key}: "${value}"`);
      });

      // Verificar se os campos problemáticos estão preenchidos
      const problematicFields = ['company_id', 'maintenance_type', 'assigned_user_id', 'estimated_cost', 'status'];
      console.log('\n   🔍 Verificação dos campos problemáticos:');
      problematicFields.forEach(field => {
        const value = formData[field];
        const status = value && value !== '' ? '✅ PREENCHIDO' : '❌ VAZIO';
        console.log(`      ${field}: ${status} (valor: "${value}")`);
      });
    }

    console.log('\n✅ TESTE COMPLETO FINALIZADO!');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
  }
}

testEditFormData().catch(console.error);