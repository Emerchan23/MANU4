const http = require('http');

async function testPDFGeneration() {
  console.log('🔄 Testando geração de PDF da OS 81...');
  
  const postData = JSON.stringify({
    type: 'service-order',
    data: {
      id: 81,
      order_number: 'OS20251012132034',
      equipment_name: 'Equipamento Teste Frontend',
      equipment_model: 'Modelo Teste',
      company_name: 'TechMed Soluções',
      description: 'Teste de conversão para OS',
      priority: 'MEDIA',
      status: 'ABERTA',
      requested_date: '12/10/2025',
      scheduled_date: '12/10/2025',
      created_by_name: 'Admin Testado',
      assigned_to_name: 'Admin Testado',
      maintenance_type_name: 'PREVENTIVE'
    }
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/pdf/generate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`📊 Status: ${res.statusCode}`);
      console.log(`📊 Headers:`, res.headers);

      let data = [];

      res.on('data', (chunk) => {
        data.push(chunk);
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const buffer = Buffer.concat(data);
          console.log(`✅ PDF gerado com sucesso! Tamanho: ${buffer.length} bytes`);
          
          // Salvar o PDF
          const fs = require('fs');
          fs.writeFileSync('test-os-81.pdf', buffer);
          console.log('💾 PDF salvo como test-os-81.pdf');
          
          resolve(buffer);
        } else {
          const responseText = Buffer.concat(data).toString();
          console.log(`❌ Erro na geração do PDF: ${responseText}`);
          reject(new Error(`HTTP ${res.statusCode}: ${responseText}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Erro na requisição:', err);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

testPDFGeneration()
  .then(() => {
    console.log('🎉 Teste de PDF concluído com sucesso!');
  })
  .catch((error) => {
    console.error('❌ Erro no teste de PDF:', error.message);
  });