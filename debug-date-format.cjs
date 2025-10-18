// Script para debugar o formato de data retornado pela API
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

async function debugDateFormat() {
  console.log('🔍 DEBUG: Investigando formato de data na API de manutenção preventiva');
  console.log('=' .repeat(80));

  try {
    // Buscar dados da API
    console.log('\n📋 1. BUSCANDO DADOS DA API...');
    const response = await fetch(`${BASE_URL}/api/preventive-maintenance`);
    const result = await response.json();
    
    console.log('Status:', response.status);
    console.log('Estrutura da resposta:', Object.keys(result));
    console.log('Quantidade de manutenções:', result.data ? result.data.length : 0);
    
    if (result.data && result.data.length > 0) {
      console.log('\n📊 2. ANALISANDO FORMATO DAS DATAS...');
      
      // Analisar as primeiras 3 manutenções
      const samplesToAnalyze = Math.min(3, result.data.length);
      
      for (let i = 0; i < samplesToAnalyze; i++) {
        const maintenance = result.data[i];
        console.log(`\n--- Manutenção ${i + 1} ---`);
        console.log('ID:', maintenance.id);
        console.log('Title:', maintenance.title);
        
        // Verificar todos os campos de data
        const dateFields = ['scheduled_date', 'nextDueDate', 'next_due_date', 'created_at', 'updated_at'];
        
        dateFields.forEach(field => {
          if (maintenance[field] !== undefined) {
            console.log(`${field}:`, maintenance[field]);
            console.log(`  - Tipo: ${typeof maintenance[field]}`);
            console.log(`  - Valor: "${maintenance[field]}"`);
            
            // Tentar criar Date object
            try {
              const dateObj = new Date(maintenance[field]);
              console.log(`  - Date object: ${dateObj}`);
              console.log(`  - É válida: ${!isNaN(dateObj.getTime())}`);
              console.log(`  - getTime(): ${dateObj.getTime()}`);
            } catch (error) {
              console.log(`  - ERRO ao criar Date: ${error.message}`);
            }
          }
        });
        
        // Mostrar todos os campos disponíveis
        console.log('Todos os campos:', Object.keys(maintenance));
      }
      
      console.log('\n🔍 3. VERIFICANDO CAMPOS ESPECÍFICOS USADOS NO DASHBOARD...');
      
      // Verificar se existe nextDueDate ou campos similares
      const firstMaintenance = result.data[0];
      const possibleDateFields = Object.keys(firstMaintenance).filter(key => 
        key.toLowerCase().includes('date') || 
        key.toLowerCase().includes('due') ||
        key.toLowerCase().includes('scheduled')
      );
      
      console.log('Campos relacionados a data encontrados:', possibleDateFields);
      
      possibleDateFields.forEach(field => {
        console.log(`\n${field}:`);
        console.log(`  Valor: ${firstMaintenance[field]}`);
        console.log(`  Tipo: ${typeof firstMaintenance[field]}`);
        
        if (firstMaintenance[field]) {
          try {
            const date = new Date(firstMaintenance[field]);
            console.log(`  Date válida: ${!isNaN(date.getTime())}`);
            if (!isNaN(date.getTime())) {
              console.log(`  Formatada: ${date.toISOString()}`);
            }
          } catch (e) {
            console.log(`  Erro: ${e.message}`);
          }
        }
      });
      
    } else {
      console.log('❌ Nenhuma manutenção encontrada para análise');
    }

  } catch (error) {
    console.error('❌ ERRO no debug:', error);
  }
}

debugDateFormat();