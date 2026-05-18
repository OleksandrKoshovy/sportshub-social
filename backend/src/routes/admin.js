const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware, adminMiddleware);

// GET /api/admin/users — listar todos os utilizadores
router.get('/users', async (req, res, next) => {
  try {
    const usersContainer = req.app.locals.db.users;
    const { resources } = await usersContainer.items
      .query('SELECT c.id, c.username, c.fullName, c.email, c.city, c.role, c.status, c.eventsCount, c.avgRating, c.createdAt FROM c ORDER BY c.createdAt DESC')
      .fetchAll();
    res.json(resources);
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id/status — suspender ou reativar utilizador
router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ error: 'Status deve ser "active" ou "blocked".' });
    }

    const usersContainer = req.app.locals.db.users;
    const { resources } = await usersContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: req.params.id }] })
      .fetchAll();

    if (!resources.length) return res.status(404).json({ error: 'Utilizador não encontrado.' });
    const user = resources[0];

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Não podes suspender outro administrador.' });
    }

    const { resource: updated } = await usersContainer.item(user.id, user.id).replace({ ...user, status });
    res.json({ message: `Utilizador ${status === 'active' ? 'reativado' : 'suspenso'}.`, user: updated });
  } catch (err) { next(err); }
});

// DELETE /api/admin/users/:id — eliminar conta
router.delete('/users/:id', async (req, res, next) => {
  try {
    const usersContainer = req.app.locals.db.users;
    const { resources } = await usersContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: req.params.id }] })
      .fetchAll();

    if (!resources.length) return res.status(404).json({ error: 'Utilizador não encontrado.' });
    await usersContainer.item(resources[0].id, resources[0].id).delete();
    res.json({ message: 'Conta eliminada.' });
  } catch (err) { next(err); }
});

// GET /api/admin/events — listar todos os eventos
router.get('/events', async (req, res, next) => {
  try {
    const eventsContainer = req.app.locals.db.events;
    const { resources } = await eventsContainer.items
      .query('SELECT * FROM c ORDER BY c.createdAt DESC')
      .fetchAll();
    res.json(resources);
  } catch (err) { next(err); }
});

// PATCH /api/admin/events/:id/cancel — cancelar evento
router.patch('/events/:id/cancel', async (req, res, next) => {
  try {
    const eventsContainer = req.app.locals.db.events;
    const { resources } = await eventsContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: req.params.id }] })
      .fetchAll();

    if (!resources.length) return res.status(404).json({ error: 'Evento não encontrado.' });
    const event = resources[0];

    await eventsContainer.item(event.id, event.id).replace({ ...event, status: 'cancelled' });
    res.json({ message: 'Evento cancelado pelo administrador.' });
  } catch (err) { next(err); }
});

// GET /api/admin/stats — estatísticas da plataforma
router.get('/stats', async (req, res, next) => {
  try {
    const { db } = req.app.locals;
    const [usersRes, eventsRes, ratingsRes] = await Promise.all([
      db.users.items.query('SELECT VALUE COUNT(1) FROM c').fetchAll(),
      db.events.items.query('SELECT VALUE COUNT(1) FROM c WHERE c.status = "active"').fetchAll(),
      db.ratings.items.query('SELECT VALUE COUNT(1) FROM c').fetchAll(),
    ]);
    res.json({
      totalUsers:   usersRes.resources[0] || 0,
      activeEvents: eventsRes.resources[0] || 0,
      totalRatings: ratingsRes.resources[0] || 0,
    });
  } catch (err) { next(err); }
});

module.exports = router;
