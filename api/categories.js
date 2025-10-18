import express from 'express';
import mysql from 'mysql2/promise';

const router = express.Router();

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Senha vazia conforme testado
  database: 'hospital_maintenance'
};

// GET - Buscar todas as categorias
router.get('/', async (req, res) => {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(
      'SELECT id, name, is_electrical, description FROM categories'
    );
    
    // Converter is_electrical de número para boolean
    const categoriesWithBoolean = rows.map(category => ({
      ...category,
      is_electrical: Boolean(category.is_electrical)
    }));
    
    console.log('✅ Categorias encontradas:', rows.length);
    res.json(categoriesWithBoolean);
    
  } catch (error) {
    console.error('❌ Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// POST - Criar nova categoria
router.post('/', async (req, res) => {
  let connection;
  
  try {
    const { name, isElectrical, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }
    
    connection = await mysql.createConnection(dbConfig);
    
    // Converter isElectrical para número (1 ou 0) para o MySQL
    const electricalValue = isElectrical ? 1 : 0;
    
    const [result] = await connection.execute(
      'INSERT INTO categories (name, is_electrical, description) VALUES (?, ?, ?)',
      [name, electricalValue, description || null]
    );
    
    const newCategory = {
      id: result.insertId,
      name,
      is_electrical: Boolean(isElectrical),
      description: description || null
    };
    
    console.log('✅ Categoria criada:', newCategory);
    res.status(201).json(newCategory);
    
  } catch (error) {
    console.error('❌ Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// PUT - Atualizar categoria
router.put('/:id', async (req, res) => {
  let connection;
  
  try {
    const { id } = req.params;
    const { name, isElectrical, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }
    
    connection = await mysql.createConnection(dbConfig);
    
    // Converter isElectrical para número (1 ou 0) para o MySQL
    const electricalValue = isElectrical ? 1 : 0;
    
    const [result] = await connection.execute(
      'UPDATE categories SET name = ?, is_electrical = ?, description = ? WHERE id = ?',
      [name, electricalValue, description || null, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    const updatedCategory = {
      id,
      name,
      is_electrical: Boolean(isElectrical),
      description: description || null
    };
    
    console.log('✅ Categoria atualizada:', updatedCategory);
    res.json(updatedCategory);
    
  } catch (error) {
    console.error('❌ Erro ao atualizar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// DELETE - Excluir categoria
router.delete('/:id', async (req, res) => {
  let connection;
  
  try {
    const { id } = req.params;
    
    connection = await mysql.createConnection(dbConfig);
    
    const [result] = await connection.execute(
      'DELETE FROM categories WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    console.log('✅ Categoria excluída:', id);
    res.json({ message: 'Categoria excluída com sucesso' });
    
  } catch (error) {
    console.error('❌ Erro ao excluir categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

export default router;