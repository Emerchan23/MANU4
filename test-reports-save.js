import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Carregar variáveis de ambiente
dotenv.config();

async function testReportsSave() {
  console.log('📋 Testando salvamento de relatórios...');
  
  // Configuração do banco
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_maintenance'
  };
  
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco MariaDB');
    
    // Primeiro, vamos verificar se existe uma tabela de relatórios
    console.log('\n🔍 Verificando tabelas existentes...');
    const [tables] = await connection.execute('SHOW TABLES');
    
    console.log('📋 Tabelas encontradas:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });
    
    // Verificar se existe tabela de relatórios
    const reportTables = tables.filter(table => {
      const tableName = Object.values(table)[0].toLowerCase();
      return tableName.includes('report') || tableName.includes('relatorio');
    });
    
    if (reportTables.length === 0) {
      console.log('\n⚠️  Nenhuma tabela de relatórios encontrada.');
      console.log('🔧 Criando tabela de relatórios para teste...');
      
      // Criar tabela de relatórios temporária para teste
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS reports (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(200) NOT NULL,
          type ENUM('maintenance', 'equipment', 'performance', 'cost', 'other') NOT NULL,
          description TEXT,
          generated_by INT NOT NULL,
          generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          period_start DATE,
          period_end DATE,
          filters JSON,
          data JSON,
          file_path VARCHAR(500),
          status ENUM('generating', 'completed', 'failed') DEFAULT 'generating',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (generated_by) REFERENCES users(id),
          INDEX idx_type (type),
          INDEX idx_generated_by (generated_by),
          INDEX idx_status (status)
        )
      `;
      
      await connection.execute(createTableQuery);
      console.log('✅ Tabela reports criada com sucesso!');
    } else {
      console.log(`\n✅ Tabela de relatórios encontrada: ${Object.values(reportTables[0])[0]}`);
    }
    
    // Verificar estrutura da tabela reports
    console.log('\n🔍 Verificando estrutura da tabela reports...');
    const [structure] = await connection.execute('DESCRIBE reports');
    
    console.log('📋 Estrutura da tabela reports:');
    structure.forEach(column => {
      console.log(`   ${column.Field}: ${column.Type} ${column.Null === 'NO' ? '(NOT NULL)' : '(NULL)'} ${column.Key ? `[${column.Key}]` : ''}`);
    });
    
    // Vamos buscar um usuário existente para usar como generated_by
    console.log('\n🔍 Buscando usuário existente...');
    const [userResult] = await connection.execute('SELECT id FROM users LIMIT 1');
    
    if (userResult.length === 0) {
      throw new Error('Nenhum usuário encontrado no banco para criar relatório');
    }
    
    const userId = userResult[0].id;
    console.log(`✅ Usuário encontrado com ID: ${userId}`);
    
    // Dados de teste para relatório
    const testReport = {
      title: 'Relatório de Teste de Manutenção',
      type: 'maintenance',
      description: 'Relatório de teste para verificação do sistema de salvamento',
      generated_by: userId,
      period_start: '2024-01-01',
      period_end: '2024-12-31',
      filters: JSON.stringify({ sector: 'all', equipment_type: 'all' }),
      data: JSON.stringify({ total_maintenance: 10, completed: 8, pending: 2 }),
      status: 'generating'
    };
    
    console.log('\n📝 Dados do relatório de teste:');
    console.log(`   Título: ${testReport.title}`);
    console.log(`   Tipo: ${testReport.type}`);
    console.log(`   Gerado por: ${testReport.generated_by}`);
    console.log(`   Período: ${testReport.period_start} a ${testReport.period_end}`);
    console.log(`   Status: ${testReport.status}`);
    
    // 1. Testar inserção
    console.log('\n1. Testando inserção de relatório...');
    const insertQuery = `
      INSERT INTO reports (
        title, type, description, generated_by, period_start, period_end, 
        filters, data, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [insertResult] = await connection.execute(insertQuery, [
      testReport.title,
      testReport.type,
      testReport.description,
      testReport.generated_by,
      testReport.period_start,
      testReport.period_end,
      testReport.filters,
      testReport.data,
      testReport.status
    ]);
    
    const reportId = insertResult.insertId;
    console.log(`✅ Relatório inserido com ID: ${reportId}`);
    
    // 2. Verificar inserção
    console.log('\n2. Verificando inserção...');
    const [selectResult] = await connection.execute(
      'SELECT * FROM reports WHERE id = ?',
      [reportId]
    );
    
    if (selectResult.length === 0) {
      throw new Error('Relatório não foi inserido corretamente');
    }
    
    console.log('✅ Relatório inserido com sucesso!');
    console.log(`   ID: ${selectResult[0].id}`);
    console.log(`   Título: ${selectResult[0].title}`);
    console.log(`   Tipo: ${selectResult[0].type}`);
    console.log(`   Status: ${selectResult[0].status}`);
    
    // 3. Testar atualização
    console.log('\n3. Testando atualização de relatório...');
    const updateQuery = `
      UPDATE reports 
      SET status = ?, title = ?, file_path = ?
      WHERE id = ?
    `;
    
    await connection.execute(updateQuery, [
      'completed',
      'Relatório de Manutenção ATUALIZADO',
      '/reports/maintenance_report_2024.pdf',
      reportId
    ]);
    
    // 4. Verificar atualização
    console.log('\n4. Verificando atualização...');
    const [updateResult] = await connection.execute(
      'SELECT status, title, file_path FROM reports WHERE id = ?',
      [reportId]
    );
    
    if (updateResult[0].status !== 'completed' || 
        updateResult[0].title !== 'Relatório de Manutenção ATUALIZADO') {
      throw new Error('Relatório não foi atualizado corretamente');
    }
    
    console.log('✅ Relatório atualizado com sucesso!');
    console.log(`   Status: ${updateResult[0].status}`);
    console.log(`   Título: ${updateResult[0].title}`);
    console.log(`   Arquivo: ${updateResult[0].file_path}`);
    
    // 5. Contar total de relatórios
    console.log('\n5. Contando total de relatórios...');
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM reports');
    console.log(`✅ Total de relatórios no banco: ${countResult[0].total}`);
    
    // 6. Testar relacionamento com usuário
    console.log('\n6. Testando relacionamento com usuário...');
    const [userRelationResult] = await connection.execute(`
      SELECT u.nick as user_nick, r.title as report_title
      FROM reports r
      JOIN users u ON r.generated_by = u.id
      WHERE r.id = ?
    `, [reportId]);
    
    if (userRelationResult.length > 0) {
      const relation = userRelationResult[0];
      console.log(`✅ Relacionamento confirmado:`);
      console.log(`   Usuário: ${relation.user_nick}`);
      console.log(`   Relatório: ${relation.report_title}`);
    }
    
    // 7. Limpar dados de teste
    console.log('\n7. Limpando dados de teste...');
    await connection.execute('DELETE FROM reports WHERE id = ?', [reportId]);
    console.log('✅ Dados de teste removidos');
    
    console.log('\n🎉 Teste de salvamento de relatórios CONCLUÍDO COM SUCESSO!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste de relatórios:', error.message);
    console.error('📋 Código do erro:', error.code);
    return false;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada.');
    }
  }
}

// Executar teste
testReportsSave()
  .then(success => {
    console.log(`\n📊 Resultado do teste de relatórios: ${success ? 'SUCESSO' : 'FALHA'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });