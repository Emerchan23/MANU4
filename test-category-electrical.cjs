const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function testCategoryElectrical() {
  try {
    const connection = await mysql.createConnection(config);
    console.log('🧪 Testando inserção de categoria elétrica...');
    
    // Inserir uma categoria elétrica de teste
    const testCategoryName = 'Categoria Teste Elétrica ' + Date.now();
    const [result] = await connection.execute(
      'INSERT INTO categories (name, description, is_electrical, is_active) VALUES (?, ?, ?, ?)',
      [testCategoryName, 'Categoria criada para teste de funcionalidade elétrica', 1, 1]
    );
    
    console.log(`✅ Categoria inserida com ID: ${result.insertId}`);
    
    // Verificar se foi inserida corretamente
    const [category] = await connection.execute(
      'SELECT * FROM categories WHERE id = ?',
      [result.insertId]
    );
    
    console.log('📋 Dados da categoria inserida:');
    console.log(`  - ID: ${category[0].id}`);
    console.log(`  - Nome: ${category[0].name}`);
    console.log(`  - Descrição: ${category[0].description}`);
    console.log(`  - Elétrica: ${category[0].is_electrical ? 'SIM' : 'NÃO'}`);
    console.log(`  - Ativa: ${category[0].is_active ? 'SIM' : 'NÃO'}`);
    
    // Testar atualização
    console.log('\n🔄 Testando atualização da categoria...');
    await connection.execute(
      'UPDATE categories SET is_electrical = ? WHERE id = ?',
      [0, result.insertId]
    );
    
    const [updatedCategory] = await connection.execute(
      'SELECT * FROM categories WHERE id = ?',
      [result.insertId]
    );
    
    console.log('📋 Dados após atualização:');
    console.log(`  - Elétrica: ${updatedCategory[0].is_electrical ? 'SIM' : 'NÃO'}`);
    
    // Limpar teste
    await connection.execute('DELETE FROM categories WHERE id = ?', [result.insertId]);
    console.log('🗑️ Categoria de teste removida');
    
    await connection.end();
    console.log('\n✅ Teste concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testCategoryElectrical();