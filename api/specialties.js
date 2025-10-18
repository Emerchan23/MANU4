import express from 'express'
import { query } from '../lib/database.js'

const router = express.Router()

// Get all specialties
router.get("/", async (req, res) => {
  try {
    const specialties = await query(`
      SELECT * FROM specialties 
      WHERE active = 1
      ORDER BY name
    `)

    res.json(specialties)
  } catch (error) {
    console.error("Get specialties error:", error)
    res.status(500).json({ error: "Erro ao buscar especialidades" })
  }
})

// Get specialty by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params

    const specialties = await query("SELECT * FROM specialties WHERE id = ? AND active = 1", [id])

    if (specialties.length === 0) {
      return res.status(404).json({ error: "Especialidade não encontrada" })
    }

    res.json(specialties[0])
  } catch (error) {
    console.error("Get specialty error:", error)
    res.status(500).json({ error: "Erro ao buscar especialidade" })
  }
})

// Get companies by specialty
router.get("/:id/companies", async (req, res) => {
  try {
    const { id } = req.params

    const companies = await query(`
      SELECT c.* FROM companies c
      JOIN company_specialties cs ON c.id = cs.company_id
      WHERE cs.specialty_id = ? AND c.active = 1
      ORDER BY c.name
    `, [id])

    res.json(companies)
  } catch (error) {
    console.error("Get companies by specialty error:", error)
    res.status(500).json({ error: "Erro ao buscar empresas da especialidade" })
  }
})

// Create new specialty
router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({ error: "Nome da especialidade é obrigatório" })
    }

    // Check if specialty already exists
    const existing = await query("SELECT id FROM specialties WHERE name = ?", [name])
    if (existing.length > 0) {
      return res.status(400).json({ error: "Especialidade já existe" })
    }

    const result = await query(
      `INSERT INTO specialties (name, description) VALUES (?, ?)`,
      [name, description || null]
    )

    res.status(201).json({
      id: result.insertId,
      message: "Especialidade criada com sucesso",
    })
  } catch (error) {
    console.error("Create specialty error:", error)
    res.status(500).json({ error: "Erro ao criar especialidade" })
  }
})

// Update specialty
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, active } = req.body

    const updateFields = []
    const updateValues = []

    if (name) {
      // Check if name already exists for another specialty
      const existing = await query("SELECT id FROM specialties WHERE name = ? AND id != ?", [name, id])
      if (existing.length > 0) {
        return res.status(400).json({ error: "Nome da especialidade já existe" })
      }
      updateFields.push("name = ?")
      updateValues.push(name)
    }

    if (description !== undefined) {
      updateFields.push("description = ?")
      updateValues.push(description)
    }

    if (typeof active === "boolean") {
      updateFields.push("active = ?")
      updateValues.push(active ? 1 : 0)
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" })
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP")
    updateValues.push(id)

    await query(
      `UPDATE specialties SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues
    )

    res.json({ message: "Especialidade atualizada com sucesso" })
  } catch (error) {
    console.error("Update specialty error:", error)
    res.status(500).json({ error: "Erro ao atualizar especialidade" })
  }
})

// Delete specialty (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params

    // Check if specialty has related companies
    const companies = await query("SELECT COUNT(*) as count FROM company_specialties WHERE specialty_id = ?", [id])
    if (companies[0].count > 0) {
      return res.status(400).json({
        error: "Não é possível excluir especialidade vinculada a empresas",
        details: "Remova a especialidade das empresas primeiro",
      })
    }

    // Soft delete - set active to 0
    await query("UPDATE specialties SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id])

    res.json({ message: "Especialidade excluída com sucesso" })
  } catch (error) {
    console.error("Delete specialty error:", error)
    res.status(500).json({ error: "Erro ao excluir especialidade" })
  }
})

// Add specialty to company
router.post("/company/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params
    const { specialtyId } = req.body

    if (!specialtyId) {
      return res.status(400).json({ error: "ID da especialidade é obrigatório" })
    }

    // Check if relationship already exists
    const existing = await query(
      "SELECT id FROM company_specialties WHERE company_id = ? AND specialty_id = ?",
      [companyId, specialtyId]
    )

    if (existing.length > 0) {
      return res.status(400).json({ error: "Empresa já possui esta especialidade" })
    }

    await query(
      "INSERT INTO company_specialties (company_id, specialty_id) VALUES (?, ?)",
      [companyId, specialtyId]
    )

    res.status(201).json({ message: "Especialidade adicionada à empresa com sucesso" })
  } catch (error) {
    console.error("Add specialty to company error:", error)
    res.status(500).json({ error: "Erro ao adicionar especialidade à empresa" })
  }
})

// Remove specialty from company
router.delete("/company/:companyId/:specialtyId", async (req, res) => {
  try {
    const { companyId, specialtyId } = req.params

    await query(
      "DELETE FROM company_specialties WHERE company_id = ? AND specialty_id = ?",
      [companyId, specialtyId]
    )

    res.json({ message: "Especialidade removida da empresa com sucesso" })
  } catch (error) {
    console.error("Remove specialty from company error:", error)
    res.status(500).json({ error: "Erro ao remover especialidade da empresa" })
  }
})

export default router