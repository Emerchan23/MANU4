const mysql = require('mysql2/promise');

async function checkSavedData() {
  try {
    console.log('🔍 Verificando empresa ID 33 no banco...');
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    const [rows] = await connection.execute('SELECT * FROM companies WHERE id = 33');
    
    if (rows.length > 0) {
      const company = rows[0];
      console.log('\n📋 DADOS SALVOS NO BANCO:');
      console.log('ID:', company.id);
      console.log('Nome:', company.name);
      console.log('CNPJ:', company.cnpj);
      console.log('Contato:', company.contact_person);
      console.log('Especialidades:', company.specialties);
      console.log('\n📅 DATAS DE CONTRATO:');
      console.log('Data Início:', company.contract_start_date);
      console.log('Data Fim:', company.contract_end_date);
      console.log('\n👥 TÉCNICOS:');
      console.log('Técnicos (raw):', company.technicians);
      
      if (company.technicians) {
        try {
          const technicians = JSON.parse(company.technicians);
          console.log('Técnicos (parsed):');
          technicians.forEach((tech, index) => {
            console.log(`  ${index + 1}. ${tech.name} - ${tech.specialty} - ${tech.phone}`);
          });
        } catch (e) {
          console.log('❌ Erro ao fazer parse dos técnicos:', e.message);
        }
      }
      
      console.log('\n🎉 RESULTADO DO TESTE:');
      console.log('✅ Empresa salva:', company.name ? 'SIM' : 'NÃO');
      console.log('✅ Datas de contrato salvas:', (company.contract_start_date && company.contract_end_date) ? 'SIM' : 'NÃO');
      console.log('✅ Técnicos salvos:', company.technicians ? 'SIM' : 'NÃO');
      
      if (company.name && company.contract_start_date && company.contract_end_date && company.technicians) {
        console.log('\n🎊 SUCESSO TOTAL! Todos os dados foram salvos corretamente!');
      } else {
        console.log('\n❌ FALHA! Alguns dados não foram salvos.');
        console.log('Detalhes:');
        console.log('- Nome:', company.name || 'VAZIO');
        console.log('- Data início:', company.contract_start_date || 'VAZIO');
        console.log('- Data fim:', company.contract_end_date || 'VAZIO');
        console.log('- Técnicos:', company.technicians || 'VAZIO');
      }
    } else {
      console.log('❌ Empresa não encontrada no banco!');
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkSavedData();