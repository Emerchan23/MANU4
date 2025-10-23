import express from 'express'
import { query } from '../lib/database.js'

const router = express.Router()

// Get all active sessions
router.get('/', async (req, res) => {
  try {
    const sessions = await query(`
      SELECT s.*, u.full_name as user_name, u.username
      FROM user_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.expires_at > NOW()
      ORDER BY s.created_at DESC
    `)

    res.json(sessions)
  } catch (error) {
    console.error('Get sessions error:', error)
    res.status(500).json({ error: 'Erro ao buscar sessões' })
  }
})

// Get session by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const sessions = await query(`
      SELECT s.*, u.full_name as user_name, u.username
      FROM user_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [id])

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Sessão não encontrada' })
    }

    res.json(sessions[0])
  } catch (error) {
    console.error('Get session error:', error)
    res.status(500).json({ error: 'Erro ao buscar sessão' })
  }
})

// Create new session
router.post('/', async (req, res) => {
  try {
    const { user_id, token, expires_at } = req.body

    if (!user_id || !token) {
      return res.status(400).json({ error: 'ID do usuário e token são obrigatórios' })
    }

    const result = await query(`
      INSERT INTO user_sessions (user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, NOW())
    `, [user_id, token, expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000)])

    res.status(201).json({
      id: result.insertId,
      message: 'Sessão criada com sucesso'
    })
  } catch (error) {
    console.error('Create session error:', error)
    res.status(500).json({ error: 'Erro ao criar sessão' })
  }
})

// Delete session (logout)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    await query('DELETE FROM user_sessions WHERE id = ?', [id])

    res.json({ message: 'Sessão encerrada com sucesso' })
  } catch (error) {
    console.error('Delete session error:', error)
    res.status(500).json({ error: 'Erro ao encerrar sessão' })
  }
})

// Clean expired sessions
router.delete('/cleanup/expired', async (req, res) => {
  try {
    const result = await query('DELETE FROM user_sessions WHERE expires_at < NOW()')

    res.json({ 
      message: 'Sessões expiradas removidas com sucesso',
      removed: result.affectedRows
    })
  } catch (error) {
    console.error('Clean expired sessions error:', error)
    res.status(500).json({ error: 'Erro ao limpar sessões expiradas' })
  }
})

export default router