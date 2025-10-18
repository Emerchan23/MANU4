import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import crypto from 'crypto';

// Carregar variáveis de ambiente
dotenv.config();

async function checkPasswordHashes() {
  let connection;
  
  try {
    // Conectar ao MariaDB
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
      port: process.env.DB_PORT || 3306
    });
    
    console.log('🔍 Verificando hashes de senha no banco de dados...');
    
    // Buscar todos os usuários ativos
    const [rows] = await connection.execute(
      'SELECT nick, password, name, role FROM users WHERE is_active = 1'
    );
    
    console.log(`\n📊 Encontrados ${rows.length} usuários ativos:`);
    
    for (const user of rows) {
      console.log(`\n👤 Usuário: ${user.nick} (${user.name})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Hash: ${user.password}`);
      console.log(`   Tipo: ${detectHashType(user.password)}`);
      
      // Testar algumas senhas comuns
      const commonPasswords = [
        `${user.nick}123`,
        'admin123',
        'gestor123',
        'usuario123',
        'tecnico123',
        '123456',
        'password',
        user.nick
      ];
      
      for (const testPass of commonPasswords) {
        if (await testPasswordHash(testPass, user.password)) {
          console.log(`   ✅ Senha encontrada: '${testPass}'`);
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

function detectHashType(hash) {
  if (!hash) return 'VAZIO';
  if (hash.startsWith('$2')) return 'bcrypt';
  if (hash.length === 64 && /^[a-f0-9]+$/i.test(hash)) return 'SHA256';
  if (hash.length === 32 && /^[a-f0-9]+$/i.test(hash)) return 'MD5';
  if (hash.length === 40 && /^[a-f0-9]+$/i.test(hash)) return 'SHA1';
  return 'TEXTO_PLANO_OU_OUTRO';
}

async function testPasswordHash(password, hash) {
  // Testar bcrypt (simulado)
  if (hash.startsWith('$2')) {
    // Não podemos testar bcrypt sem a biblioteca
    return false;
  }
  
  // Testar SHA256
  const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
  if (sha256Hash === hash) {
    return true;
  }
  
  // Testar MD5
  const md5Hash = crypto.createHash('md5').update(password).digest('hex');
  if (md5Hash === hash) {
    return true;
  }
  
  // Testar SHA1
  const sha1Hash = crypto.createHash('sha1').update(password).digest('hex');
  if (sha1Hash === hash) {
    return true;
  }
  
  // Testar texto plano
  if (password === hash) {
    return true;
  }
  
  return false;
}

checkPasswordHashes().catch(console.error);