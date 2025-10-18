// Usar https nativo do Node.js
const https = require('https');
const http = require('http');

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data))
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

const BASE_URL = 'http://localhost:3000';

async function testCompleteFlow() {
  console.log('🧪 TESTE COMPLETO: Fluxo de Criação e Listagem de Manutenção Preventiva');
  console.log('=' .repeat(80));

  try {
    // 1. Primeiro, listar manutenções existentes
    console.log('\n📋 1. LISTANDO MANUTENÇÕES EXISTENTES...');
    const listResponse1 = await fetch(`${BASE_URL}/api/preventive-maintenance`);
    const listResult1 = await listResponse1.json();
    
    console.log('Status:', listResponse1.status);
    console.log('Estrutura da resposta:', Object.keys(listResult1));
    console.log('Quantidade inicial:', listResult1.data ? listResult1.data.length : 0);
    
    if (listResult1.data && listResult1.data.length > 0) {
      console.log('Primeira manutenção:', JSON.stringify(listResult1.data[0], null, 2));
    }

    // 2. Criar nova manutenção preventiva
    console.log('\n📝 2. CRIANDO NOVA MANUTENÇÃO PREVENTIVA...');
    const newMaintenance = {
      equipmentId: 1,
      title: "Teste Completo - Manutenção de Equipamento",
      description: "Teste do fluxo completo de criação e listagem",
      frequency: "MONTHLY",
      type: "INSPECTION",
      priority: "HIGH",
      scheduledDate: "2024-02-15",
      estimatedDuration: 120,
      estimatedCost: 250.00,
      notes: "Teste realizado para verificar o fluxo completo"
    };

    const createResponse = await fetch(`${BASE_URL}/api/preventive-maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newMaintenance)
    });

    const createResult = await createResponse.json();
    console.log('Status da criação:', createResponse.status);
    console.log('Resultado da criação:', JSON.stringify(createResult, null, 2));

    if (!createResult.success) {
      console.log('❌ ERRO na criação:', createResult.error);
      return;
    }

    // 3. Aguardar um pouco e listar novamente
    console.log('\n⏳ 3. AGUARDANDO E LISTANDO NOVAMENTE...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const listResponse2 = await fetch(`${BASE_URL}/api/preventive-maintenance`);
    const listResult2 = await listResponse2.json();
    
    console.log('Status da listagem:', listResponse2.status);
    console.log('Quantidade após criação:', listResult2.data ? listResult2.data.length : 0);
    
    // 4. Verificar se a nova manutenção aparece
    console.log('\n🔍 4. VERIFICANDO SE A NOVA MANUTENÇÃO APARECE...');
    if (listResult2.data && listResult2.data.length > 0) {
      const newMaintenanceFound = listResult2.data.find(m => 
        m.title === newMaintenance.title
      );
      
      if (newMaintenanceFound) {
        console.log('✅ SUCESSO! Nova manutenção encontrada na listagem:');
        console.log(JSON.stringify(newMaintenanceFound, null, 2));
      } else {
        console.log('❌ PROBLEMA! Nova manutenção NÃO encontrada na listagem');
        console.log('Manutenções disponíveis:');
        listResult2.data.forEach((m, index) => {
          console.log(`${index + 1}. ${m.title} (ID: ${m.id})`);
        });
      }
    } else {
      console.log('❌ PROBLEMA! Nenhuma manutenção retornada na listagem');
    }

    // 5. Testar com filtros
    console.log('\n🔍 5. TESTANDO LISTAGEM COM FILTROS...');
    const filteredResponse = await fetch(`${BASE_URL}/api/preventive-maintenance?priority=HIGH`);
    const filteredResult = await filteredResponse.json();
    
    console.log('Status da listagem filtrada:', filteredResponse.status);
    console.log('Quantidade com filtro HIGH:', filteredResult.data ? filteredResult.data.length : 0);

    console.log('\n🎉 TESTE COMPLETO FINALIZADO!');
    console.log('=' .repeat(80));

  } catch (error) {
    console.error('❌ ERRO no teste completo:', error);
  }
}

testCompleteFlow();