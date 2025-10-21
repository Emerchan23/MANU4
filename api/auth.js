import express from 'express';

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
    
    // Teste simples - aceitar admin/admin123
    if (username === 'admin' && password === 'admin123') {
      console.log('Login bem-sucedido para admin');
      return res.json({
        success: true,
        user: {
          id: 1,
          username: 'admin',
          name: 'Administrador',
          role: 'admin',
          isAdmin: true
        }
      });
    }
    
    console.log('Credenciais inválidas');
    return res.status(401).json({ error: 'Credenciais inválidas' });
    
  } catch (error) {
    console.error('Erro geral no login:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

export default router;