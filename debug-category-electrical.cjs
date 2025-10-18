const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function debugCategoryElectrical() {
  try {
    const connection = await mysql.createConnection(config);
    console.log('🔍 Debugando problema do campo elétrica...');
    
    // Verificar os últimos registros inseridos
    console.log('\n📋 Últimas 5 categorias inseridas:');
    const [recent] = await connection.execute(
      'SELECT id, name, is_electrical, description, created_at FROM categories ORDER BY id DESC LIMIT 5'
    );
    
    recent.forEach(cat => {
      console.log(`  - ID: ${cat.id}, Nome: ${cat.name}`);
      console.log(`    is_electrical (raw): ${cat.is_electrical} (tipo: ${typeof cat.is_electrical})`);
      console.log(`    is_electrical (boolean): ${Boolean(cat.is_electrical)}`);
      console.log(`    Criado em: ${cat.created_at}`);
      console.log('');
    });
    
    // Testar inserção direta com valor 1
    console.log('🧪 Testando inserção direta com valor 1...');
    const testName = 'Debug Test Electrical ' + Date.now();
    const [result1] = await connection.execute(
      'INSERT INTO categories (name, is_electrical, description) VALUES (?, ?, ?)',
      [testName, 1, 'Teste com valor 1']
    );
    
    const [check1] = await connection.execute(
      'SELECT id, name, is_electrical FROM categories WHERE id = ?',
      [result1.insertId]
    );
    
    console.log(`✅ Inserido com valor 1:`);
    console.log(`  - is_electrical: ${check1[0].is_electrical} (tipo: ${typeof check1[0].is_electrical})`);
    console.log(`  - Boolean: ${Boolean(check1[0].is_electrical)}`);
    
    // Testar inserção direta com valor true
    console.log('\n🧪 Testando inserção direta com valor true...');
    const testName2 = 'Debug Test Electrical True ' + Date.now();
    const [result2] = await connection.execute(
      'INSERT INTO categories (name, is_electrical, description) VALUES (?, ?, ?)',
      [testName2, true, 'Teste com valor true']
    );
    
    const [check2] = await connection.execute(
      'SELECT id, name, is_electrical FROM categories WHERE id = ?',
      [result2.insertId]
    );
    
    console.log(`✅ Inserido com valor true:`);
    console.log(`  - is_electrical: ${check2[0].is_electrical} (tipo: ${typeof check2[0].is_electrical})`);
    console.log(`  - Boolean: ${Boolean(check2[0].is_electrical)}`);
    
    // Testar inserção direta com valor false
    console.log('\n🧪 Testando inserção direta com valor false...');
    const testName3 = 'Debug Test Electrical False ' + Date.now();
    const [result3] = await connection.execute(
      'INSERT INTO categories (name, is_electrical, description) VALUES (?, ?, ?)',
      [testName3, false, 'Teste com valor false']
    );
    
    const [check3] = await connection.execute(
      'SELECT id, name, is_electrical FROM categories WHERE id = ?',
      [result3.insertId]
    );
    
    console.log(`✅ Inserido com valor false:`);
    console.log(`  - is_electrical: ${check3[0].is_electrical} (tipo: ${typeof check3[0].is_electrical})`);
    console.log(`  - Boolean: ${Boolean(check3[0].is_electrical)}`);
    
    // Limpar testes
    await connection.execute('DELETE FROM categories WHERE id IN (?, ?, ?)', [result1.insertId, result2.insertId, result3.insertId]);
    console.log('\n🗑️ Registros de teste removidos');
    
    await connection.end();
    console.log('\n✅ Debug concluído!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debugCategoryElectrical();