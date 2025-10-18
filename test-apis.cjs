const axios = require('axios');

const API_URL = 'http://localhost:3000';

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testServiceOrderAPI() {
  log('\n📋 TESTE DA API DE ORDEM DE SERVIÇO\n', 'cyan');
  log('='.repeat(80), 'blue');
  
  try {
    // 1. Testar GET - Listar ordens de serviço
    log('\n1️⃣  Testando GET /api/service-orders', 'yellow');
    const getResponse = await axios.get(`${API_URL}/api/service-orders`, {
      params: {
        page: 1,
        limit: 5
      }
    });
    
    if (getResponse.data.success) {
      log('✅ GET bem-sucedido!', 'green');
      log(`   Total de registros: ${getResponse.data.pagination.totalRecords}`, 'cyan');
      log(`   Registros retornados: ${getResponse.data.data.length}`, 'cyan');
      
      if (getResponse.data.data.length > 0) {
        const firstOrder = getResponse.data.data[0];
        log('\n📄 Primeira ordem de serviço:', 'yellow');
        log(`   ID: ${firstOrder.id}`, 'cyan');
        log(`   Número: ${firstOrder.order_number}`, 'cyan');
        log(`   Equipamento: ${firstOrder.equipment_name || 'N/A'}`, 'cyan');
        log(`   Empresa: ${firstOrder.company_name || 'N/A'}`, 'cyan');
        log(`   Setor: ${firstOrder.sector_name || 'N/A'}`, 'cyan');
        log(`   Subsetor: ${firstOrder.subsector_name || 'N/A'}`, 'cyan');
        log(`   Status: ${firstOrder.status}`, 'cyan');
        log(`   Prioridade: ${firstOrder.priority}`, 'cyan');
        log(`   Data agendada: ${firstOrder.scheduled_date || 'N/A'}`, 'cyan');
        log(`   Criado por: ${firstOrder.created_by_name || 'N/A'}`, 'cyan');
        log(`   Atribuído a: ${firstOrder.assigned_to_name || 'N/A'}`, 'cyan');
        
        // Verificar formatação de data
        if (firstOrder.scheduled_date) {
          const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
          if (datePattern.test(firstOrder.scheduled_date)) {
            log('   ✅ Data formatada corretamente (dd/mm/yyyy)', 'green');
          } else {
            log('   ⚠️  Data não está no formato brasileiro esperado', 'red');
          }
        }
      }
    } else {
      log('❌ GET falhou!', 'red');
      log(`   Erro: ${getResponse.data.error}`, 'red');
    }
    
    // 2. Testar POST - Criar nova ordem de serviço
    log('\n\n2️⃣  Testando POST /api/service-orders', 'yellow');
    
    const newOrder = {
      equipment_id: 1,
      company_id: 1,
      description: 'Teste de criação de ordem de serviço via API',
      priority: 'medium',
      status: 'pending',
      requested_date: '2024-01-15',
      scheduled_date: '2024-01-20',
      created_by: 1,
      assigned_to: 1,
      type: 'preventive'
    };
    
    log('   Dados da nova ordem:', 'cyan');
    log(`   ${JSON.stringify(newOrder, null, 2)}`, 'cyan');
    
    const postResponse = await axios.post(`${API_URL}/api/service-orders`, newOrder);
    
    if (postResponse.data.success) {
      log('\n✅ POST bem-sucedido!', 'green');
      const createdOrder = postResponse.data.data;
      log(`   ID criado: ${createdOrder.id}`, 'cyan');
      log(`   Número: ${createdOrder.order_number}`, 'cyan');
      log(`   Equipamento: ${createdOrder.equipment_name || 'N/A'}`, 'cyan');
      log(`   Empresa: ${createdOrder.company_name || 'N/A'}`, 'cyan');
      log(`   Setor: ${createdOrder.sector_name || 'N/A'}`, 'cyan');
      log(`   Subsetor: ${createdOrder.subsector_name || 'N/A'}`, 'cyan');
      log(`   Data agendada: ${createdOrder.scheduled_date || 'N/A'}`, 'cyan');
      
      // Verificar formatação de data
      if (createdOrder.scheduled_date) {
        const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
        if (datePattern.test(createdOrder.scheduled_date)) {
          log('   ✅ Data formatada corretamente (dd/mm/yyyy)', 'green');
        } else {
          log('   ⚠️  Data não está no formato brasileiro esperado', 'red');
        }
      }
      
      return createdOrder.id;
    } else {
      log('❌ POST falhou!', 'red');
      log(`   Erro: ${postResponse.data.error}`, 'red');
      return null;
    }
    
  } catch (error) {
    log('\n❌ ERRO NO TESTE:', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Mensagem: ${error.response.data?.error || error.message}`, 'red');
    } else if (error.code === 'ECONNREFUSED') {
      log('   ⚠️  Servidor não está rodando!', 'red');
      log('   Por favor, inicie o servidor com: npm run dev', 'yellow');
    } else {
      log(`   ${error.message}`, 'red');
    }
    return null;
  }
}

async function testPDFGeneration(orderId) {
  log('\n\n📄 TESTE DE GERAÇÃO DE PDF\n', 'cyan');
  log('='.repeat(80), 'blue');
  
  try {
    log('\n3️⃣  Testando POST /api/pdf/generate (Ordem de Serviço)', 'yellow');
    
    const pdfData = {
      type: 'service-order',
      data: {
        id: orderId,
        order_number: 'OS-2024-001',
        equipment_name: 'Equipamento Teste',
        equipment_code: 'EQ-001',
        company_name: 'Empresa Teste',
        sector_name: 'Setor Teste',
        description: 'Descrição de teste para geração de PDF',
        priority: 'Alta',
        status: 'Pendente',
        open_date: '2024-01-15',
        due_date: '2024-01-20',
        scheduled_date: '2024-01-18',
        estimated_cost: 1500.50,
        created_by_name: 'Usuário Teste',
        assigned_to_name: 'Técnico Teste'
      }
    };
    
    log('   Dados para geração do PDF:', 'cyan');
    log(`   Tipo: ${pdfData.type}`, 'cyan');
    log(`   ID da ordem: ${pdfData.data.id}`, 'cyan');
    
    const pdfResponse = await axios.post(`${API_URL}/api/pdf/generate`, pdfData, {
      responseType: 'arraybuffer'
    });
    
    if (pdfResponse.status === 200) {
      log('\n✅ PDF gerado com sucesso!', 'green');
      log(`   Tamanho: ${(pdfResponse.data.byteLength / 1024).toFixed(2)} KB`, 'cyan');
      log(`   Content-Type: ${pdfResponse.headers['content-type']}`, 'cyan');
      
      // Salvar PDF para verificação
      const fs = require('fs');
      const pdfPath = `./test-service-order-${orderId}.pdf`;
      fs.writeFileSync(pdfPath, Buffer.from(pdfResponse.data));
      log(`   ✅ PDF salvo em: ${pdfPath}`, 'green');
      log('   📝 Abra o PDF para verificar a formatação de datas e valores', 'yellow');
    } else {
      log('❌ Falha ao gerar PDF!', 'red');
    }
    
  } catch (error) {
    log('\n❌ ERRO NA GERAÇÃO DE PDF:', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Mensagem: ${error.response.data?.error || error.message}`, 'red');
    } else {
      log(`   ${error.message}`, 'red');
    }
  }
}

async function runTests() {
  log('\n🚀 INICIANDO TESTES DAS APIS\n', 'cyan');
  log('='.repeat(80), 'blue');
  
  // Aguardar um pouco para garantir que o servidor está pronto
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Testar API de ordem de serviço
  const orderId = await testServiceOrderAPI();
  
  // Se criou uma ordem, testar geração de PDF
  if (orderId) {
    await testPDFGeneration(orderId);
  }
  
  log('\n\n' + '='.repeat(80), 'blue');
  log('✅ TESTES CONCLUÍDOS!\n', 'green');
}

// Executar testes
runTests();
