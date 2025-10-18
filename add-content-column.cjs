const mysql = require('mysql2/promise');

async function addContentColumn() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    // Adicionar coluna content
    await connection.execute('ALTER TABLE service_description_templates ADD COLUMN content TEXT AFTER description');
    console.log('Coluna content adicionada!');

    // Migrar dados da description para content
    await connection.execute('UPDATE service_description_templates SET content = description');
    console.log('Dados migrados para content!');

    // Atualizar descriptions para serem mais curtas
    const updateQuery = `
      UPDATE service_description_templates 
      SET description = CASE 
        WHEN id = 1 THEN 'Inspeção visual e teste básico de funcionamento'
        WHEN id = 2 THEN 'Substituição de filtros e verificação de vedações'
        WHEN id = 3 THEN 'Identificação e reparo de vazamentos'
        WHEN id = 4 THEN 'Instalação completa com testes iniciais'
        WHEN id = 5 THEN 'Calibração e certificação de instrumentos'
        WHEN id = 6 THEN 'Limpeza completa e desinfecção'
        WHEN id = 7 THEN 'Substituição de peças defeituosas'
        WHEN id = 8 THEN 'Verificação de sistemas de segurança'
        WHEN id = 9 THEN 'Atualização e backup de software'
        WHEN id = 10 THEN 'Testes de performance e documentação'
        ELSE description
      END
    `;
    
    await connection.execute(updateQuery);
    console.log('Descriptions atualizadas!');
    console.log('Processo concluído com sucesso!');

  } catch (error) {
    console.error('Erro:', error.message);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('A coluna content já existe na tabela.');
    }
  } finally {
    await connection.end();
  }
}

addContentColumn().catch(console.error);