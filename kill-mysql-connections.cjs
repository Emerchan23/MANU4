const mysql = require('mysql2/promise');
require('dotenv').config();

async function killMySQLConnections() {
    let connection;
    
    try {
        console.log('🔧 Conectando ao MySQL para limpar conexões...');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'hospital_maintenance',
            connectTimeout: 5000
        });

        // Mostrar processos ativos
        console.log('🔍 Verificando processos ativos...');
        const [processes] = await connection.execute('SHOW PROCESSLIST');
        
        console.log(`📊 Total de processos ativos: ${processes.length}`);
        
        if (processes.length > 0) {
            console.log('\n📋 Processos ativos:');
            processes.forEach((proc, index) => {
                console.log(`  ${index + 1}. ID: ${proc.Id}, User: ${proc.User}, Host: ${proc.Host}, DB: ${proc.db || 'NULL'}, Command: ${proc.Command}, Time: ${proc.Time}s`);
            });
            
            // Matar conexões que não são a atual
            console.log('\n🔧 Matando conexões desnecessárias...');
            let killed = 0;
            
            for (const proc of processes) {
                // Não matar a conexão atual e conexões do sistema
                if (proc.Id !== connection.threadId && 
                    proc.User !== 'system user' && 
                    proc.Command !== 'Binlog Dump' &&
                    proc.User === (process.env.DB_USER || 'root')) {
                    
                    try {
                        await connection.execute(`KILL ${proc.Id}`);
                        console.log(`  ✅ Conexão ${proc.Id} terminada`);
                        killed++;
                    } catch (killError) {
                        console.log(`  ⚠️ Não foi possível terminar conexão ${proc.Id}: ${killError.message}`);
                    }
                }
            }
            
            console.log(`\n📊 Total de conexões terminadas: ${killed}`);
        } else {
            console.log('✅ Nenhum processo ativo encontrado');
        }

        // Verificar novamente
        console.log('\n🔍 Verificando processos após limpeza...');
        const [processesAfter] = await connection.execute('SHOW PROCESSLIST');
        console.log(`📊 Processos restantes: ${processesAfter.length}`);

        console.log('\n✅ Limpeza de conexões MySQL concluída!');

    } catch (error) {
        console.error('❌ Erro ao limpar conexões MySQL:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

killMySQLConnections();