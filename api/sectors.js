import express from 'express'
import { query } from '../lib/database.js'

const router = express.Router()

// Get all sectors
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT s.id, s.name, s.description, s.manager_id
      FROM sectors s
      ORDER BY s.name
    `
    
    const sectors = await query(sql)
    res.json(sectors)
  } catch (error) {
    console.error('Erro ao buscar setores:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Create new sector
router.post('/', async (req, res) => {
  try {
    const { name, description, responsible, manager_id } = req.body
    
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' })
    }
    
    // Use 'responsible' se fornecido, senão use 'manager_id'
    const managerValue = responsible || manager_id
    
    const insertQuery = `
      INSERT INTO sectors (name, description, manager_id)
      VALUES (?, ?, ?)
    `
    
    const result = await query(insertQuery, [
      name,
      description || null,
      managerValue || null
    ])
    

    
    res.status(201).json({
      id: result.insertId,
      message: 'Setor criado com sucesso'
    })
  } catch (error) {
    console.error('Erro detalhado ao criar setor:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Update sector
router.put('/', async (req, res) => {
  try {
    const { id, name, description, responsible, manager_id } = req.body
    
    if (!id || !name) {
      return res.status(400).json({ error: 'ID e nome são obrigatórios' })
    }
    
    // Use 'responsible' se fornecido, senão use 'manager_id'
    const managerValue = responsible || manager_id
    
    const updateQuery = `
      UPDATE sectors 
      SET name = ?, description = ?, manager_id = ?
      WHERE id = ?
    `
    
    const result = await query(updateQuery, [name, description || null, managerValue || null, id])
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Setor não encontrado' })
    }
    
    console.log('Setor atualizado com sucesso, ID:', id)
    
    res.json({
      id: parseInt(id),
      message: 'Setor atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro detalhado ao atualizar setor:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Delete sector
router.delete('/', async (req, res) => {
  try {
    // Aceitar ID tanto do body quanto da query string para compatibilidade
    const id = req.body?.id || req.query?.id || req.params?.id
    
    console.log('DEBUG - Dados recebidos:', {
      body: req.body,
      query: req.query,
      params: req.params,
      id: id
    })
    
    if (!id) {
      return res.status(400).json({ error: 'ID é obrigatório' })
    }
    
    console.log('Dados recebidos para excluir setor:', { id })
    
    // Verificar se há subsetores associados
    const subsectorsCheck = await query(
      'SELECT COUNT(*) as count FROM subsectors WHERE sector_id = ?',
      [id]
    )
    
    if (subsectorsCheck[0].count > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir o setor pois há subsetores associados' 
      })
    }
    
    const deleteQuery = 'DELETE FROM sectors WHERE id = ?'
    const result = await query(deleteQuery, [id])
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Setor não encontrado' })
    }
    
    console.log('Setor excluído com sucesso, ID:', id)
    
    res.json({
      message: 'Setor excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro detalhado ao excluir setor:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

export default router