const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// GET /api/users/me — perfil do utilizador autenticado
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const usersContainer = req.app.locals.db.users;
    const { resources } = await usersContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: req.user.id }] })
      .fetchAll();

    if (!resources.length) return res.status(404).json({ error: 'Utilizador não encontrado.' });
    const { passwordHash: _, ...userSafe } = resources[0];
    res.json(userSafe);
  } catch (err) { next(err); }
});

// PUT /api/users/profile — atualizar perfil
router.put('/profile', authMiddleware, async (req, res, next) => {
  try {
    const usersContainer = req.app.locals.db.users;
    const { resources } = await usersContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: req.user.id }] })
      .fetchAll();

    if (!resources.length) return res.status(404).json({ error: 'Utilizador não encontrado.' });
    const user = resources[0];

    const { fullName, city, sports } = req.body;
    const updated = {
      ...user,
      fullName:  fullName  || user.fullName,
      city:      city      || user.city,
      sports:    sports    || user.sports,
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await usersContainer.item(user.id, user.id).replace(updated);
    const { passwordHash: _, ...safe } = resource;
    res.json(safe);
  } catch (err) { next(err); }
});

// GET /api/users/me/events — eventos do utilizador (criados + participações)
router.get('/me/events', authMiddleware, async (req, res, next) => {
  try {
    const eventsContainer = req.app.locals.db.events;
    const participationsContainer = req.app.locals.db.participations;
    const uid = req.user.id;

    // Eventos criados pelo utilizador
    const { resources: created } = await eventsContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.organizerId = @uid', parameters: [{ name: '@uid', value: uid }] })
      .fetchAll();

    // Participações do utilizador
    const { resources: parts } = await participationsContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.userId = @uid', parameters: [{ name: '@uid', value: uid }] })
      .fetchAll();

    // Buscar eventos das participações (excluindo os que já criou)
    const createdIds = new Set(created.map(e => e.id));
    const participatingEvents = [];
    for (const p of parts) {
      if (createdIds.has(p.eventId)) continue;
      const { resources: evs } = await eventsContainer.items
        .query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: p.eventId }] })
        .fetchAll();
      if (evs[0]) participatingEvents.push({ ...evs[0], isJoined: true });
    }

    const now = new Date();
    res.json({
      created:      created.map(e => ({ ...e, isJoined: true })),
      participating: participatingEvents,
      upcoming:     [...created, ...participatingEvents].filter(e => new Date(e.dateTime) >= now),
      past:         [...created, ...participatingEvents].filter(e => new Date(e.dateTime) < now),
    });
  } catch (err) { next(err); }
});

// GET /api/users/:id — perfil público
router.get('/:id', async (req, res, next) => {
  try {
    const usersContainer = req.app.locals.db.users;
    const { resources } = await usersContainer.items
      .query({
        query: 'SELECT c.id, c.username, c.fullName, c.city, c.sports, c.avgRating, c.eventsCount, c.rankingPoints, c.avatarUrl FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: req.params.id }],
      }).fetchAll();

    if (!resources.length) return res.status(404).json({ error: 'Utilizador não encontrado.' });
    res.json(resources[0]);
  } catch (err) { next(err); }
});

module.exports = router;
