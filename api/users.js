import express from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { query } from '../lib/database.js'

// Password hashing function using bcrypt (compatible with login API)
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10)
}

const router = express.Router()

// Get all users (admin only)
router.get("/", async (req, res) => {
  try {
    const users = await query(`
      SELECT u.id, u.username, u.full_name as name, u.email, u.role, u.sector_id, u.created_at, u.is_active, u.is_admin,
             s.name as sector_name
      FROM users u
      LEFT JOIN sectors s ON u.sector_id = s.id
      ORDER BY u.full_name
    `)

    // Transform data to frontend format
    const transformedUsers = users.map(user => {
      // Map database role to frontend role
      const frontendRole = user.is_admin ? 'ADMIN' : (user.role ? user.role.toUpperCase() : 'USUARIO')
      
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: frontendRole,
        allowedSectors: [],
        isActive: Boolean(user.is_active),
        sector_name: user.sector_name,
        created_at: user.created_at
      }
    })

    res.json(transformedUsers)
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({ error: "Erro ao buscar usuários" })
  }
})

// Get user by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params

    // Authentication removed - direct access allowed

    const users = await query(
      `
      SELECT u.id, u.username, u.full_name as name, u.role, u.sector_id, u.created_at, u.is_active, u.is_admin,
             s.name as sector_name
      FROM users u
      LEFT JOIN sectors s ON u.sector_id = s.id
      WHERE u.id = ?
    `,
      [id],
    )

    if (users.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" })
    }

    const user = users[0]

    res.json(user)
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ error: "Erro ao buscar usuário" })
  }
})

// Create new user
router.post("/", async (req, res) => {
  try {
    // Map frontend fields to database fields
    const { username, password, name, email, role, allowedSectors, sector_id, permissions } = req.body
    
    if (!username || !password || !name) {
      return res.status(400).json({ error: "Username, senha e nome são obrigatórios" })
    }

    // Check if username already exists
    const existingUser = await query("SELECT id FROM users WHERE username = ?", [username])
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Username já está em uso" })
    }

    // Check if email already exists
    if (email) {
      const existingEmail = await query("SELECT id FROM users WHERE email = ?", [email])
      if (existingEmail.length > 0) {
        return res.status(400).json({ error: "Email já está em uso" })
      }
    }

    const hashedPassword = await hashPassword(password)
    
    // Determine if user is admin
    const isAdmin = role === 'ADMIN' ? 1 : 0

    const result = await query(
      `
      INSERT INTO users (username, password, full_name, email, role, is_admin, sector_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [username, hashedPassword, name, email || null, role, isAdmin, sector_id || null, 1],
    )

    // Return user data in frontend format
    const newUser = {
      id: result.insertId,
      username: username,
      name,
      email: email || null,
      role: role,
      allowedSectors: allowedSectors || [],
      isActive: true
    }

    res.status(201).json(newUser)
  } catch (error) {
    console.error("Create user error:", error)
    res.status(500).json({ error: "Erro ao criar usuário" })
  }
})

// Update user
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, role, allowedSectors, sector_id, permissions, isActive, is_active, password } = req.body

    console.log('🔧 PUT /api/users/:id - Dados recebidos:', {
      id,
      body: req.body
    });

    // Authentication removed - direct access allowed

    const updateFields = []
    const updateValues = []

    if (name) {
      updateFields.push("full_name = ?")
      updateValues.push(name)
    }
    
    // Handle full_name from request body
    if (req.body.full_name) {
      updateFields.push("full_name = ?")
      updateValues.push(req.body.full_name)
    }
    
    // Handle username from request body
    if (req.body.username) {
      updateFields.push("username = ?")
      updateValues.push(req.body.username)
    }

    if (email !== undefined) {
      updateFields.push("email = ?")
      updateValues.push(email)
    }

    if (role) {
      updateFields.push("role = ?")
      updateValues.push(role)
      
      // Update is_admin based on role
      const isAdmin = role === 'ADMIN' ? 1 : 0
      updateFields.push("is_admin = ?")
      updateValues.push(isAdmin)
    }
    
    // Handle is_admin from request body
    if (req.body.is_admin !== undefined) {
      updateFields.push("is_admin = ?")
      updateValues.push(req.body.is_admin)
    }
    
    if (sector_id) {
      updateFields.push("sector_id = ?")
      updateValues.push(sector_id)
    }
    
    const activeStatus = isActive !== undefined ? isActive : is_active
    if (typeof activeStatus === "boolean") {
      updateFields.push("is_active = ?")
      updateValues.push(activeStatus)
    }

    if (password) {
      const hashedPassword = await hashPassword(password)
      updateFields.push("password_hash = ?")
      updateValues.push(hashedPassword)
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" })
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP")
    updateValues.push(id)

    console.log('🔧 Query SQL:', `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`);
    console.log('🔧 Valores:', updateValues);

    await query(
      `
      UPDATE users SET ${updateFields.join(", ")}
      WHERE id = ?
    `,
      updateValues,
    )

    // Get updated user data
    const updatedUsers = await query(
      `SELECT u.id, u.username, u.full_name as name, u.email, u.is_active, u.is_admin, u.created_at,
              s.name as sector_name
       FROM users u
       LEFT JOIN sectors s ON u.sector_id = s.id
       WHERE u.id = ?`,
      [id]
    )

    if (updatedUsers.length > 0) {
      const user = updatedUsers[0]
      
      const frontendRole = user.is_admin ? 'ADMIN' : 'USUARIO'
      
      const transformedUser = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: frontendRole,
        allowedSectors: [],
        isActive: Boolean(user.is_active),
        sector_name: user.sector_name,
        created_at: user.created_at
      }
      
      res.json(transformedUser)
    } else {
      res.json({ message: "Usuário atualizado com sucesso" })
    }
  } catch (error) {
    console.error("Update user error:", error)
    res.status(500).json({ error: "Erro ao atualizar usuário" })
  }
})

// Delete user (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params

    // Check if user has related records
    const serviceOrders = await query(
      "SELECT COUNT(*) as count FROM service_orders WHERE created_by = ? OR assigned_to = ?",
      [id, id],
    )
    if (serviceOrders[0].count > 0) {
      return res.status(400).json({
        error: "Não é possível excluir usuário com ordens de serviço vinculadas",
        details: "Exclua ou transfira as ordens de serviço primeiro",
      })
    }

    // Note: Active column doesn't exist, using DELETE instead of soft delete
    await query("DELETE FROM users WHERE id = ?", [id])

    res.json({ message: "Usuário desativado com sucesso" })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({ error: "Erro ao excluir usuário" })
  }
})

export default router
