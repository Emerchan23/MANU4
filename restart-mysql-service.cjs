const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function restartMySQLService() {
    try {
        console.log('🔧 Tentando reiniciar o serviço MySQL...');
        
        // Tentar parar o serviço MySQL
        try {
            console.log('⏹️ Parando serviço MySQL...');
            await execPromise('net stop mysql');
            console.log('✅ Serviço MySQL parado');
        } catch (error) {
            console.log('⚠️ Erro ao parar MySQL (pode já estar parado):', error.message);
        }
        
        // Aguardar um pouco
        console.log('⏳ Aguardando 3 segundos...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Tentar iniciar o serviço MySQL
        try {
            console.log('▶️ Iniciando serviço MySQL...');
            await execPromise('net start mysql');
            console.log('✅ Serviço MySQL iniciado');
        } catch (error) {
            console.log('❌ Erro ao iniciar MySQL:', error.message);
            
            // Tentar com XAMPP
            console.log('🔧 Tentando iniciar MySQL via XAMPP...');
            try {
                await execPromise('"C:\\xampp\\mysql\\bin\\mysqld.exe" --defaults-file="C:\\xampp\\mysql\\bin\\my.ini" --standalone --console');
                console.log('✅ MySQL iniciado via XAMPP');
            } catch (xamppError) {
                console.log('❌ Erro ao iniciar MySQL via XAMPP:', xamppError.message);
            }
        }
        
        // Aguardar mais um pouco
        console.log('⏳ Aguardando 5 segundos para estabilizar...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('✅ Processo de reinicialização do MySQL concluído!');
        
    } catch (error) {
        console.error('❌ Erro geral ao reiniciar MySQL:', error.message);
    }
}

restartMySQLService();