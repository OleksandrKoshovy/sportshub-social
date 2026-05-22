const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// POST /api/ratings — submeter avaliação
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { eventId, ratedUserId, score, comment } = req.body;

    if (!eventId || !ratedUserId || !score) {
      return res.status(400).json({ error: 'eventId, ratedUserId e score são obrigatórios.' });
    }
    if (score < 1 || score > 5) {
      return res.status(400).json({ error: 'Score deve ser entre 1 e 5.' });
    }
    if (ratedUserId === req.user.id) {
      return res.status(400).json({ error: 'Não podes avaliar-te a ti próprio.' });
    }

    const ratingsContainer       = req.app.locals.db.ratings;
    const participationsContainer = req.app.locals.db.participations;
    const eventsContainer         = req.app.locals.db.events;

    // Verificar se o evento existe e está concluído
    const { resources: evList } = await eventsContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: eventId }] })
      .fetchAll();

    if (!evList.length) return res.status(404).json({ error: 'Evento não encontrado.' });
    const event = evList[0];

    const eventDate = new Date(event.dateTime);
    if (eventDate > new Date()) {
      return res.status(400).json({ error: 'Só podes avaliar após a conclusão do evento.' });
    }

    // Verificar se o avaliador participou no evento
    const { resources: myPart } = await participationsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.eventId = @eid AND c.userId = @uid',
        parameters: [{ name: '@eid', value: eventId }, { name: '@uid', value: req.user.id }],
      }).fetchAll();

    if (!myPart.length) {
      return res.status(403).json({ error: 'Só podes avaliar participantes de eventos em que participaste.' });
    }

    // Verificar se o avaliado participou no evento
    const { resources: theirPart } = await participationsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.eventId = @eid AND c.userId = @uid',
        parameters: [{ name: '@eid', value: eventId }, { name: '@uid', value: ratedUserId }],
      }).fetchAll();

    if (!theirPart.length) {
      return res.status(400).json({ error: 'O utilizador avaliado não participou neste evento.' });
    }

    // Verificar se já avaliou este utilizador neste evento
    const { resources: existingRating } = await ratingsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.eventId = @eid AND c.raterId = @rid AND c.ratedId = @rdid',
        parameters: [
          { name: '@eid',  value: eventId },
          { name: '@rid',  value: req.user.id },
          { name: '@rdid', value: ratedUserId },
        ],
      }).fetchAll();

    if (existingRating.length > 0) {
      return res.status(409).json({ error: 'Já avaliaste este utilizador neste evento.' });
    }

    const newRating = {
      id:          uuidv4(),
      eventId,
      raterId:     req.user.id,
      ratedId:     ratedUserId,
      score:       parseInt(score),
      comment:     comment || '',
      createdAt:   new Date().toISOString(),
    };

    const { resource: created } = await ratingsContainer.items.create(newRating);

    // Atualizar avgRating e rankingPoints do utilizador avaliado
    try {
      const usersContainer = req.app.locals.db.users;

      // Buscar todas as avaliações deste utilizador
      const { resources: allRatings } = await ratingsContainer.items
        .query({ query: 'SELECT c.score FROM c WHERE c.ratedId = @uid', parameters: [{ name: '@uid', value: ratedUserId }] })
        .fetchAll();

      const avgRating = allRatings.length
        ? Math.round((allRatings.reduce((s, r) => s + r.score, 0) / allRatings.length) * 10) / 10
        : 0;

      // Buscar utilizador e atualizar
      const { resources: userList } = await usersContainer.items
        .query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: ratedUserId }] })
        .fetchAll();

      if (userList[0]) {
        const u = userList[0];
        const rankingPoints = Math.round(avgRating * 20) + (u.eventsCount || 0) * 5;
        await usersContainer.item(u.id, u.id).replace({ ...u, avgRating, rankingPoints });
      }
    } catch (rankErr) {
      console.warn('[WARN] Erro ao atualizar ranking:', rankErr.message);
    }

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// GET /api/ratings/user/:userId — avaliações recebidas por um utilizador
router.get('/user/:userId', async (req, res, next) => {
  try {
    const ratingsContainer = req.app.locals.db.ratings;
    const { resources } = await ratingsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.ratedId = @uid ORDER BY c.createdAt DESC',
        parameters: [{ name: '@uid', value: req.params.userId }],
      }).fetchAll();
    res.json(resources);
  } catch (err) {
    next(err);
  }
});

// GET /api/ratings/given/:userId — avaliações feitas por um utilizador
router.get('/given/:userId', async (req, res, next) => {
  try {
    const ratingsContainer = req.app.locals.db.ratings;
    const { resources } = await ratingsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.raterId = @uid',
        parameters: [{ name: '@uid', value: req.params.userId }],
      }).fetchAll();
    res.json(resources);
  } catch (err) {
    next(err);
  }
});

// GET /api/ratings/stats — estatísticas globais de avaliações
router.get('/stats', async (req, res, next) => {
  try {
    const ratingsContainer = req.app.locals.db.ratings;
    const { resources } = await ratingsContainer.items
      .query({ query: 'SELECT VALUE COUNT(1) FROM c' })
      .fetchAll();
    res.json({ totalRatings: resources[0] || 0 });
  } catch (err) {
    next(err);
  }
});

// GET /api/ratings/ranking — ranking global
router.get('/ranking', async (req, res, next) => {
  try {
    const { sport } = req.query;
    const usersContainer = req.app.locals.db.users;

    let query = 'SELECT c.id, c.username, c.fullName, c.city, c.sports, c.avgRating, c.eventsCount, c.rankingPoints, c.avatarUrl FROM c WHERE c.status = "active" AND c.eventsCount > 0';
    const parameters = [];

    if (sport) {
      query += ' AND ARRAY_CONTAINS(c.sports, @sport)';
      parameters.push({ name: '@sport', value: sport });
    }

    query += ' ORDER BY c.rankingPoints DESC OFFSET 0 LIMIT 50';

    const { resources: ranking } = await usersContainer.items
      .query({ query, parameters })
      .fetchAll();

    res.json(ranking);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
