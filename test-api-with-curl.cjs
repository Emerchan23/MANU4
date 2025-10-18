const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function testApiWithCurl() {
  try {
    console.log('🔍 Testando API com curl...');
    
    const scheduleId = 8;
    const updateData = {
      status: 'concluido',
      observations: 'Teste via curl - campos funcionando corretamente'
    };

    console.log('📊 Dados sendo enviados:', updateData);

    const curlCommand = `curl -X PUT "http://localhost:3000/api/maintenance-schedules/${scheduleId}" -H "Content-Type: application/json" -d "${JSON.stringify(updateData).replace(/"/g, '\\"')}" -v`;
    
    console.log('📊 Comando curl:', curlCommand);

    const { stdout, stderr } = await execPromise(curlCommand);
    
    console.log('\n📊 STDOUT (resposta):', stdout);
    console.log('\n📊 STDERR (headers e debug):', stderr);

  } catch (error) {
    console.error('❌ Erro na requisição curl:', error.message);
    if (error.stdout) console.log('📊 STDOUT:', error.stdout);
    if (error.stderr) console.log('📊 STDERR:', error.stderr);
  }
}

testApiWithCurl();