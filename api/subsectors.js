import express from 'express'
import { query } from '../lib/database.js'

const router = express.Router()

// Get all subsectors
router.get('/', async (req, res) => {
  try {
    const { sector_id } = req.query
    
    let sql = `
      SELECT s.id, s.name, s.description, s.sector_id, sec.name as sector_name
      FROM subsectors s
      JOIN sectors sec ON s.sector_id = sec.id
    `
    const params = []
    
    if (sector_id) {
      sql += ' WHERE s.sector_id = ?'
      params.push(sector_id)
    }
    
    sql += ' ORDER BY sec.name, s.name'
    
    const subsectors = await query(sql, params)
    
    res.json(subsectors)
  } catch (error) {
    console.error('Erro ao buscar subsetores:', error)
    res.status(500).json({ error: 'Erro ao buscar subsetores' })
  }
})

// Create new subsector
router.post('/', async (req, res) => {
  try {
    const { name, description, sector_id } = req.body
    
    if (!name || !sector_id) {
      return res.status(400).json({ error: 'Nome e setor são obrigatórios' })
    }
    
    const result = await query(
      'INSERT INTO subsectors (name, description, sector_id) VALUES (?, ?, ?)',
      [name, description || null, sector_id]
    )
    
    res.status(201).json({
      id: result.insertId,
      message: 'Subsetor criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar subsetor:', error)
    res.status(500).json({ error: 'Erro ao criar subsetor' })
  }
})

// Update subsector
router.put('/', async (req, res) => {
  try {
    const { id, name, description, sector_id } = req.body
    
    if (!id || !name || !sector_id) {
      return res.status(400).json({ error: 'ID, nome e setor são obrigatórios' })
    }
    
    const result = await query(
      'UPDATE subsectors SET name = ?, description = ?, sector_id = ? WHERE id = ?',
      [name, description || null, sector_id, id]
    )
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Subsetor não encontrado' })
    }
    
    res.json({
      id: parseInt(id),
      message: 'Subsetor atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar subsetor:', error)
    res.status(500).json({ error: 'Erro ao atualizar subsetor' })
  }
})

// Delete subsector
router.delete('/', async (req, res) => {
  try {
    // Aceitar ID tanto do body quanto da query string para compatibilidade
    const id = req.body.id || req.query.id
    
    if (!id) {
      return res.status(400).json({ error: 'ID do subsetor é obrigatório' })
    }
    
    const result = await query('DELETE FROM subsectors WHERE id = ?', [id])
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Subsetor não encontrado' })
    }
    
    res.json({ message: 'Subsetor excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir subsetor:', error)
    res.status(500).json({ error: 'Erro ao excluir subsetor' })
  }
})

export default router