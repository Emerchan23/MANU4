# 🔧 CORREÇÕES NECESSÁRIAS NA API

## 1. Correção da Query Principal (api/equipment.js)

```javascript
// ANTES (INCORRETO):
const queryStr = `
  SELECT 
    e.id, e.name, e.patrimonio, e.model, e.serial_number, e.manufacturer,
    e.sector_id, e.category_id, e.subsector_id, e.installation_date,
    e.last_preventive_maintenance, e.next_preventive_maintenance,
    e.maintenance_frequency_days, e.warranty_expiry, e.status,
    e.observations, e.created_at, e.updated_at, e.patrimonio_number,
    e.voltage, e.power, e.maintenance_frequency,
    s.nome as sector_name,
    c.name as category_name,  -- ❌ ERRO: tabela 'categorias' não existe
    sub.name as subsector_name
  FROM equipment e
  LEFT JOIN setores s ON e.sector_id = s.id
  LEFT JOIN categorias c ON e.category_id = c.id  -- ❌ ERRO
  LEFT JOIN subsetores sub ON e.subsector_id = sub.id
  ORDER BY e.created_at DESC
`;

// DEPOIS (CORRETO):
const queryStr = `
  SELECT 
    e.id, e.name, e.patrimonio_number, e.model, e.serial_number, e.manufacturer,
    e.sector_id, e.category_id, e.subsector_id, e.installation_date,
    e.maintenance_frequency_days, e.status, e.observations, 
    e.created_at, e.updated_at, e.voltage,
    s.nome as sector_name,
    c.name as category_name,  -- ✅ CORRETO: usar 'categories'
    sub.nome as subsector_name
  FROM equipment e
  LEFT JOIN setores s ON e.sector_id = s.id
  LEFT JOIN categories c ON e.category_id = c.id  -- ✅ CORRETO
  LEFT JOIN subsetores sub ON e.subsector_id = sub.id
  ORDER BY e.created_at DESC
`;
```

## 2. Validação de Data Brasileira

```javascript
// Função para converter data dd/mm/aaaa para ISO
function parseDataBrasileira(dataBr) {
  if (!dataBr || dataBr.trim() === '') return null;
  
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dataBr.match(regex);
  
  if (!match) {
    throw new Error('Data deve estar no formato dd/mm/aaaa');
  }
  
  const [, dia, mes, ano] = match;
  const data = new Date(ano, mes - 1, dia);
  
  // Validar se a data é válida (evita 31/02/2024)
  if (data.getDate() != dia || data.getMonth() != (mes - 1) || data.getFullYear() != ano) {
    throw new Error('Data inválida');
  }
  
  return data.toISOString().split('T')[0]; // Retorna YYYY-MM-DD
}

// Usar na validação do POST/PUT
const installation_date = parseDataBrasileira(req.body.installation_date);
```

## 3. Validações de Negócio

```javascript
// Validação completa para criação/atualização de equipamento
function validateEquipmentData(data) {
  const errors = [];
  
  // 1. Patrimônio obrigatório e único
  if (!data.patrimonio_number || data.patrimonio_number.trim() === '') {
    errors.push('Número do patrimônio é obrigatório');
  }
  
  // 2. Nome obrigatório
  if (!data.name || data.name.trim() === '') {
    errors.push('Nome do equipamento é obrigatório');
  }
  
  // 3. Frequência de manutenção deve ser > 0
  if (data.maintenance_frequency_days !== null && data.maintenance_frequency_days <= 0) {
    errors.push('Frequência de manutenção deve ser maior que zero');
  }
  
  // 4. Status deve ser válido
  const validStatus = ['Ativo', 'Inativo', 'Em_Manutencao'];
  if (data.status && !validStatus.includes(data.status)) {
    errors.push('Status deve ser: Ativo, Inativo ou Em_Manutencao');
  }
  
  // 5. Data de instalação
  if (data.installation_date) {
    try {
      parseDataBrasileira(data.installation_date);
    } catch (error) {
      errors.push(error.message);
    }
  }
  
  return errors;
}
```

## 4. Tratamento de Erros Específicos

```javascript
// POST /equipamentos
const createEquipment = async (req, res) => {
  try {
    // Validar dados
    const errors = validateEquipmentData(req.body);
    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors
      });
    }
    
    // Converter data
    const installation_date = parseDataBrasileira(req.body.installation_date);
    
    // Inserir no banco
    const result = await query(`
      INSERT INTO equipment (
        patrimonio_number, name, manufacturer, model, serial_number,
        category_id, sector_id, subsector_id, installation_date,
        maintenance_frequency_days, status, observations, voltage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.body.patrimonio_number,
      req.body.name,
      req.body.manufacturer,
      req.body.model,
      req.body.serial_number,
      req.body.category_id,
      req.body.sector_id,
      req.body.subsector_id,
      installation_date,
      req.body.maintenance_frequency_days,
      req.body.status || 'Ativo',
      req.body.observations,
      req.body.voltage
    ]);
    
    res.status(201).json({
      success: true,
      data: { id: result.insertId },
      message: 'Equipamento criado com sucesso'
    });
    
  } catch (error) {
    // Tratar erros específicos
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.message.includes('patrimonio')) {
        return res.status(409).json({
          success: false,
          message: 'Número do patrimônio já existe'
        });
      }
      if (error.message.includes('serial')) {
        return res.status(409).json({
          success: false,
          message: 'Número de série já existe'
        });
      }
    }
    
    console.error('Erro ao criar equipamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};
```