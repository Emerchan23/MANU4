const mysql = require('mysql2/promise');

async function fixWithValidStatus() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });
  
  console.log('=== CORRIGINDO COM STATUS VÁLIDO ===');
  
  // Primeiro, adicionar ATRASADA ao ENUM
  try {
    const alterQuery = `ALTER TABLE service_orders MODIFY status ENUM('ABERTA','EM_ANDAMENTO','AGUARDANDO_PECA','CONCLUIDA','CANCELADA','ATRASADA') DEFAULT 'ABERTA'`;
    await connection.execute(alterQuery);
    console.log('ENUM atualizado com sucesso');
  } catch (error) {
    console.log('Erro ao atualizar ENUM:', error.message);
  }
  
  // Agora atualizar os status
  const [update1] = await connection.execute('UPDATE service_orders SET status = ? WHERE id = ?', ['ATRASADA', 55]);
  const [update2] = await connection.execute('UPDATE service_orders SET status = ? WHERE id = ?', ['ATRASADA', 57]);
  console.log('Updates realizados:', update1.affectedRows, update2.affectedRows);
  
  // Verificar resultado
  const [result] = await connection.execute('SELECT id, status, actual_cost FROM service_orders WHERE status = ?', ['ATRASADA']);
  console.log('Ordens ATRASADAS:', result);
  
  await connection.end();
}

fixWithValidStatus().catch(console.error);