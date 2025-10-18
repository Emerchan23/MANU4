import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// Templates de exemplo para inserir
const exampleTemplates = [
  {
    name: 'Manutenção Preventiva Completa',
    category_id: 4, // Manutenção Preventiva
    description: `MANUTENÇÃO PREVENTIVA COMPLETA

1. INSPEÇÃO VISUAL GERAL:
   - Verificar estado geral do equipamento
   - Identificar sinais de desgaste, corrosão ou danos
   - Verificar integridade de cabos e conexões
   - Inspecionar painel de controle e displays

2. LIMPEZA E HIGIENIZAÇÃO:
   - Limpeza externa com produtos adequados
   - Limpeza interna (quando aplicável)
   - Desinfecção de superfícies de contato
   - Remoção de poeira e detritos

3. VERIFICAÇÕES ELÉTRICAS:
   - Teste de continuidade elétrica
   - Verificação de aterramento
   - Medição de corrente e tensão
   - Inspeção de fusíveis e disjuntores

4. VERIFICAÇÕES MECÂNICAS:
   - Lubrificação de partes móveis
   - Ajuste de tensão de correias
   - Verificação de rolamentos e buchas
   - Teste de movimentação e alinhamento

5. CALIBRAÇÃO E TESTES:
   - Verificação de precisão dos sensores
   - Calibração conforme especificações
   - Testes de funcionamento em diferentes modos
   - Verificação de alarmes e sistemas de segurança

6. DOCUMENTAÇÃO:
   - Registro de todas as atividades realizadas
   - Anotação de valores medidos
   - Recomendações para próximas manutenções
   - Atualização do histórico do equipamento

Tempo estimado: _______________
Próxima manutenção: _______________
Técnico responsável: _______________`,
    is_active: true
  },
  {
    name: 'Reparo de Equipamento Eletrônico',
    category_id: 3, // Manutenção Corretiva
    description: `REPARO DE EQUIPAMENTO ELETRÔNICO

1. DIAGNÓSTICO INICIAL:
   - Análise dos sintomas reportados
   - Verificação do histórico de falhas
   - Inspeção visual dos componentes
   - Teste básico de funcionamento

2. TESTES DIAGNÓSTICOS:
   - Medição de tensões nos pontos de teste
   - Verificação de sinais de entrada e saída
   - Teste de componentes individuais
   - Análise de circuitos com multímetro/osciloscópio

3. IDENTIFICAÇÃO DO PROBLEMA:
   - Localização do componente defeituoso
   - Análise da causa raiz da falha
   - Verificação de componentes relacionados
   - Avaliação do impacto no sistema

4. EXECUÇÃO DO REPARO:
   - Desligamento e isolamento do equipamento
   - Substituição de componentes defeituosos
   - Soldagem e conexões conforme padrões
   - Limpeza da área de trabalho

5. TESTES PÓS-REPARO:
   - Verificação de funcionamento básico
   - Teste de todos os modos operacionais
   - Verificação de parâmetros de segurança
   - Teste de estresse e estabilidade

6. VALIDAÇÃO E ENTREGA:
   - Calibração final do equipamento
   - Teste de aceitação com usuário
   - Documentação do reparo realizado
   - Orientações de uso e cuidados

Problema identificado: _______________
Componentes substituídos: _______________
Tempo de reparo: _______________
Garantia do serviço: _______________
Técnico responsável: _______________`,
    is_active: true
  }
];

async function insertExampleTemplates() {
  let connection;
  
  try {
    console.log('🔄 Inserindo templates de exemplo...');
    
    // Conectar ao banco de dados
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');
    
    // Inserir cada template
    for (let i = 0; i < exampleTemplates.length; i++) {
      const template = exampleTemplates[i];
      
      try {
        console.log(`📝 Inserindo template: ${template.name}`);
        
        const [result] = await connection.execute(`
          INSERT INTO service_description_templates 
          (name, category_id, description, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, NOW(), NOW())
        `, [
          template.name,
          template.category_id,
          template.description,
          template.is_active
        ]);
        
        console.log(`✅ Template inserido com ID: ${result.insertId}`);
        
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️ Template '${template.name}' já existe (ignorando)`);
        } else {
          console.error(`❌ Erro ao inserir template '${template.name}':`, error.message);
          throw error;
        }
      }
    }
    
    // Verificar total de templates
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM service_description_templates');
    console.log(`\n📊 Total de templates no banco: ${count[0].total}`);
    
    console.log('🎉 Templates de exemplo inseridos com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

// Executar inserção
insertExampleTemplates();