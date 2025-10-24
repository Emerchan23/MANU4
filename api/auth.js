import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../lib/database.js';

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    console.log('=== LOGIN EXPRESS ===');
    console.log('Body recebido:', req.body);
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Campos obrigatórios ausentes');
      return res.status(400).json({ error: 'Username e password são obrigatórios' });
    }
    
    // Buscar usuário no banco de dados
    const users = await query(
      'SELECT id, username, full_name, email, password_hash, role, is_admin, is_active FROM users WHERE username = ? AND is_active = 1',
      [username]
    );
    
    if (users.length === 0) {
      console.log('Usuário não encontrado:', username);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const user = users[0];
    
    // Verificar senha - suportar tanto bcrypt quanto SHA256 (para compatibilidade)
    console.log('Verificando senha para usuário:', username);
    console.log('Senha fornecida:', password);
    console.log('Hash no banco:', user.password_hash);
    console.log('Tipo de hash:', user.password_hash.startsWith('$2b$') ? 'bcrypt' : 'SHA256');
    
    let isPasswordValid = false;
    
    // Verificar se é hash bcrypt (começa com $2b$)
    if (user.password_hash && user.password_hash.startsWith('$2b$')) {
      console.log('Usando verificação bcrypt...');
      isPasswordValid = await bcrypt.compare(password, user.password_hash);
      console.log('Resultado bcrypt:', isPasswordValid);
    } else {
      // Assumir que é SHA256 (para usuários antigos)
      console.log('Usando verificação SHA256...');
      const crypto = await import('crypto');
      const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
      isPasswordValid = sha256Hash === user.password_hash;
      console.log('Hash SHA256 gerado:', sha256Hash);
      console.log('Hash no banco:', user.password_hash);
      console.log('Resultado SHA256:', isPasswordValid);
    }
    
    if (!isPasswordValid) {
      console.log('Senha inválida para usuário:', username);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    console.log(`Login bem-sucedido para ${username}`);
    
    // Mapear role do banco para frontend
    let frontendRole = 'user';
    if (user.is_admin) {
      frontendRole = 'admin';
    } else if (user.role) {
      const roleUpper = user.role.toUpperCase();
      if (roleUpper === 'ADMIN') {
        frontendRole = 'admin';
      } else if (roleUpper === 'GESTOR') {
        frontendRole = 'manager';
      } else if (roleUpper === 'TECNICO') {
        frontendRole = 'technician';
      } else {
        frontendRole = 'user';
      }
    }
    
    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.full_name,
        email: user.email,
        role: frontendRole,
        isAdmin: Boolean(user.is_admin)
      }
    });
    
  } catch (error) {
    console.error('Erro geral no login:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

export default router;