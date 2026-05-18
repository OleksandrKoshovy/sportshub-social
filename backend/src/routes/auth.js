const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const router  = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { username, fullName, email, password, city, sports } = req.body;

    if (!username || !fullName || !email || !password) {
      return res.status(400).json({ error: 'Campos obrigatórios em falta.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'A palavra-passe deve ter pelo menos 6 caracteres.' });
    }

    const usersContainer = req.app.locals.db.users;

    // Verificar se o email já existe
    const { resources: existing } = await usersContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.email = @email', parameters: [{ name: '@email', value: email }] })
      .fetchAll();

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email já registado.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = {
      id:           uuidv4(),
      username:     username.toLowerCase(),
      fullName,
      email:        email.toLowerCase(),
      passwordHash,
      city:         city || '',
      sports:       sports || [],
      role:         'user',
      avatarUrl:    null,
      avgRating:    0,
      eventsCount:  0,
      rankingPoints:0,
      status:       'active',
      createdAt:    new Date().toISOString(),
    };

    const { resource: created } = await usersContainer.items.create(newUser);

    const token = jwt.sign(
      { id: created.id, username: created.username, email: created.email, role: created.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userSafe } = created;
    res.status(201).json({ user: userSafe, token });

  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e palavra-passe são obrigatórios.' });
    }

    const usersContainer = req.app.locals.db.users;
    const { resources } = await usersContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.email = @email', parameters: [{ name: '@email', value: email.toLowerCase() }] })
      .fetchAll();

    if (resources.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const user = resources[0];

    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Conta suspensa. Contacta o administrador.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userSafe } = user;
    res.json({ user: userSafe, token });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
