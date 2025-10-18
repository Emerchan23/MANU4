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
      SELECT u.id, u.nick, u.name, u.email, u.profile, u.sector_id, u.permissions, u.created_at,
             s.nome as sector_name
      FROM users u
      LEFT JOIN setores s ON u.sector_id = s.id
      ORDER BY u.name
    `)

    // Transform data to frontend format
    const transformedUsers = users.map(user => {
      const permissions = JSON.parse(user.permissions || "{}")
      
      // Map database profile to frontend role
      const frontendRole = {
        'admin': 'ADMIN',
        'gestor': 'GESTOR',
        'usuario': 'USUARIO'
      }[user.profile] || 'USUARIO'
      
      return {
        id: user.id,
        username: user.nick,
        name: user.name,
        email: user.email, // Use email from database
        role: frontendRole,
        allowedSectors: permissions.allowedSectors || [],
        isActive: true, // Active column doesn't exist, assume true
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
      SELECT u.id, u.nick, u.name, u.profile, u.sector_id, u.permissions, u.created_at,
             s.nome as sector_name
      FROM users u
      LEFT JOIN setores s ON u.sector_id = s.id
      WHERE u.id = ?
    `,
      [id],
    )

    if (users.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" })
    }

    const user = users[0]
    user.permissions = JSON.parse(user.permissions || "{}")

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
    const { username, nick, password, name, email, role, allowedSectors, sector_id, permissions } = req.body
    
    // Use username if nick is not provided (for compatibility with frontend)
    const userNick = nick || username
    
    if (!userNick || !password || !name) {
      return res.status(400).json({ error: "Username, senha e nome são obrigatórios" })
    }

    // Check if nick already exists
    const existingUser = await query("SELECT id FROM users WHERE nick = ?", [userNick])
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Username já está em uso" })
    }

    // Note: Email column doesn't exist in database
    // if (email) {
    //   const existingEmail = await query("SELECT id FROM users WHERE email = ?", [email])
    //   if (existingEmail.length > 0) {
    //     return res.status(400).json({ error: "Email já está em uso" })
    //   }
    // }

    const hashedPassword = await hashPassword(password)
    
    // Map role from frontend format to database profile format
    const dbProfile = {
      'ADMIN': 'admin',
      'GESTOR': 'gestor',
      'TECNICO': 'usuario',
      'TECHNICIAN': 'usuario',
      'USUARIO': 'usuario'
    }[role] || 'usuario'
    
    // Create permissions object from allowedSectors
    const userPermissions = {
      allowedSectors: allowedSectors || [],
      ...permissions
    }
    const permissionsJson = JSON.stringify(userPermissions)

    const result = await query(
      `
      INSERT INTO users (nick, password, name, profile, sector_id, permissions)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [userNick, hashedPassword, name, dbProfile, sector_id || null, permissionsJson],
    )

    // Return user data in frontend format
    const newUser = {
      id: result.insertId,
      username: userNick,
      name,
      email: null, // Email column doesn't exist
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

    // Authentication removed - direct access allowed

    const updateFields = []
    const updateValues = []

    if (name) {
      updateFields.push("name = ?")
      updateValues.push(name)
    }

    // Note: Email column doesn't exist in database
    // if (email !== undefined) {
    //   updateFields.push("email = ?")
    //   updateValues.push(email)
    // }

    // Allow all updates without authentication checks
    if (role) {
      // Map frontend role to database profile
      const dbProfile = {
        'ADMIN': 'admin',
        'GESTOR': 'gestor',
        'TECNICO': 'usuario',
        'USUARIO': 'usuario'
      }[role] || 'usuario'
      
      updateFields.push("profile = ?")
      updateValues.push(dbProfile)
    }
    if (sector_id) {
      updateFields.push("sector_id = ?")
      updateValues.push(sector_id)
    }
    if (allowedSectors || permissions) {
      const userPermissions = {
        allowedSectors: allowedSectors || [],
        ...permissions
      }
      updateFields.push("permissions = ?")
      updateValues.push(JSON.stringify(userPermissions))
    }
    // Note: Active column doesn't exist in database
    // const activeStatus = isActive !== undefined ? isActive : is_active
    // if (typeof activeStatus === "boolean") {
    //   updateFields.push("active = ?")
    //   updateValues.push(activeStatus)
    // }

    if (password) {
      const hashedPassword = await hashPassword(password)
      updateFields.push("password = ?")
      updateValues.push(hashedPassword)
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" })
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP")
    updateValues.push(id)

    await query(
      `
      UPDATE users SET ${updateFields.join(", ")}
      WHERE id = ?
    `,
      updateValues,
    )

    // Get updated user data
    const updatedUsers = await query(
      `SELECT u.id, u.nick, u.name, u.profile, u.sector_id, u.permissions, u.created_at,
              s.nome as sector_name
       FROM users u
       LEFT JOIN setores s ON u.sector_id = s.id
       WHERE u.id = ?`,
      [id]
    )

    if (updatedUsers.length > 0) {
      const user = updatedUsers[0]
      const userPermissions = JSON.parse(user.permissions || "{}")
      
      const frontendRole = {
        'admin': 'ADMIN',
        'gestor': 'GESTOR',
        'usuario': 'USUARIO'
      }[user.profile] || 'USUARIO'
      
      const transformedUser = {
        id: user.id,
        username: user.nick,
        name: user.name,
        email: null, // Email column doesn't exist
        role: frontendRole,
        allowedSectors: userPermissions.allowedSectors || [],
        isActive: true, // Active column doesn't exist
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
