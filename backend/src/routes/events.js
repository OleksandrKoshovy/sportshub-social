const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// GET /api/events — listar eventos com filtros
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { sport, city, date, available, sort = 'date', page = 1, limit = 20, upcoming } = req.query;
    const eventsContainer = req.app.locals.db.events;
    const participationsContainer = req.app.locals.db.participations;

    let query = 'SELECT * FROM c WHERE c.status != "cancelled"';
    const parameters = [];

    // Por defeito só mostra eventos futuros (a menos que upcoming=false explicitamente)
    if (upcoming !== 'false') {
      const now = new Date().toISOString();
      query += ' AND c.dateTime >= @now';
      parameters.push({ name: '@now', value: now });
    }

    if (sport)     { query += ' AND c.sport = @sport';  parameters.push({ name: '@sport', value: sport }); }
    if (city)      { query += ' AND CONTAINS(c.location, @city, true)'; parameters.push({ name: '@city', value: city }); }
    if (date)      { query += ' AND c.date = @date';    parameters.push({ name: '@date', value: date }); }
    if (available === 'true') query += ' AND c.currentParticipants < c.maxParticipants';

    if (sort === 'date')         query += ' ORDER BY c.dateTime ASC';
    else if (sort === 'popular') query += ' ORDER BY c.currentParticipants DESC';

    const { resources: events } = await eventsContainer.items
      .query({ query, parameters })
      .fetchAll();

    // Marcar isJoined se utilizador autenticado
    let joinedIds = new Set();
    if (req.user) {
      const { resources: parts } = await participationsContainer.items
        .query({ query: 'SELECT c.eventId FROM c WHERE c.userId = @uid', parameters: [{ name: '@uid', value: req.user.id }] })
        .fetchAll();
      joinedIds = new Set(parts.map(p => p.eventId));
    }

    const enriched = events.map(e => ({ ...e, isJoined: joinedIds.has(e.id) }));
    res.json({ events: enriched, total: enriched.length, page: parseInt(page) });
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:id — detalhe de um evento
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const eventsContainer = req.app.locals.db.events;
    const participationsContainer = req.app.locals.db.participations;

    const { resources } = await eventsContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: req.params.id }] })
      .fetchAll();

    if (!resources.length) return res.status(404).json({ error: 'Evento não encontrado.' });

    let isJoined = false;
    if (req.user) {
      const { resources: parts } = await participationsContainer.items
        .query({
          query: 'SELECT * FROM c WHERE c.eventId = @eid AND c.userId = @uid',
          parameters: [{ name: '@eid', value: req.params.id }, { name: '@uid', value: req.user.id }],
        }).fetchAll();
      isJoined = parts.length > 0;
    }

    res.json({ ...resources[0], isJoined });
  } catch (err) {
    next(err);
  }
});

// POST /api/events — criar evento (requer auth)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { title, sport, location, date, time, maxParticipants, description } = req.body;

    if (!title || !sport || !location || !date || !time || !maxParticipants) {
      return res.status(400).json({ error: 'Campos obrigatórios em falta.' });
    }

    const eventsContainer = req.app.locals.db.events;
    const participationsContainer = req.app.locals.db.participations;

    const newEvent = {
      id:                  uuidv4(),
      title,
      sport,
      location,
      date,
      time,
      dateTime:            `${date}T${time}:00`,
      maxParticipants:     parseInt(maxParticipants),
      currentParticipants: 1, // organizador é automaticamente inscrito
      description:         description || '',
      organizerId:         req.user.id,
      organizerName:       req.user.username,
      status:              'active',
      photoUrls:           [],
      createdAt:           new Date().toISOString(),
    };

    const { resource: createdEvent } = await eventsContainer.items.create(newEvent);

    // Inscrever o organizador automaticamente
    await participationsContainer.items.create({
      id:        uuidv4(),
      eventId:   createdEvent.id,
      userId:    req.user.id,
      joinedAt:  new Date().toISOString(),
      status:    'confirmed',
    });

    res.status(201).json(createdEvent);
  } catch (err) {
    next(err);
  }
});

// PUT /api/events/:id — editar evento (só organizador ou admin)
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const eventsContainer = req.app.locals.db.events;
    const { resources } = await eventsContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: req.params.id }] })
      .fetchAll();

    if (!resources.length) return res.status(404).json({ error: 'Evento não encontrado.' });
    const event = resources[0];

    if (event.organizerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para editar este evento.' });
    }

    const { title, location, date, time, maxParticipants, description } = req.body;
    const updated = {
      ...event,
      title:           title || event.title,
      location:        location || event.location,
      date:            date || event.date,
      time:            time || event.time,
      dateTime:        date && time ? `${date}T${time}:00` : event.dateTime,
      maxParticipants: maxParticipants ? parseInt(maxParticipants) : event.maxParticipants,
      description:     description !== undefined ? description : event.description,
      updatedAt:       new Date().toISOString(),
    };

    const { resource: updatedEvent } = await eventsContainer.item(event.id, event.id).replace(updated);
    res.json(updatedEvent);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:id — cancelar evento
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const eventsContainer = req.app.locals.db.events;
    const { resources } = await eventsContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: req.params.id }] })
      .fetchAll();

    if (!resources.length) return res.status(404).json({ error: 'Evento não encontrado.' });
    const event = resources[0];

    if (event.organizerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para cancelar este evento.' });
    }

    await eventsContainer.item(event.id, event.id).replace({ ...event, status: 'cancelled' });
    res.json({ message: 'Evento cancelado com sucesso.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:id/join — inscrever-se num evento
router.post('/:id/join', authMiddleware, async (req, res, next) => {
  try {
    const eventsContainer        = req.app.locals.db.events;
    const participationsContainer = req.app.locals.db.participations;

    const { resources: evList } = await eventsContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: req.params.id }] })
      .fetchAll();

    if (!evList.length) return res.status(404).json({ error: 'Evento não encontrado.' });
    const event = evList[0];

    if (event.currentParticipants >= event.maxParticipants) {
      return res.status(409).json({ error: 'Evento sem vagas disponíveis.' });
    }

    // Verificar se já está inscrito
    const { resources: existing } = await participationsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.eventId = @eid AND c.userId = @uid',
        parameters: [{ name: '@eid', value: req.params.id }, { name: '@uid', value: req.user.id }],
      }).fetchAll();

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Já estás inscrito neste evento.' });
    }

    // Criar participação
    await participationsContainer.items.create({
      id:       uuidv4(),
      eventId:  event.id,
      userId:   req.user.id,
      joinedAt: new Date().toISOString(),
      status:   'confirmed',
    });

    // Incrementar contador
    await eventsContainer.item(event.id, event.id).replace({
      ...event,
      currentParticipants: event.currentParticipants + 1,
    });

    res.json({ message: 'Inscrito com sucesso!' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:id/join — cancelar inscrição
router.delete('/:id/join', authMiddleware, async (req, res, next) => {
  try {
    const eventsContainer        = req.app.locals.db.events;
    const participationsContainer = req.app.locals.db.participations;

    const { resources: evList } = await eventsContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: req.params.id }] })
      .fetchAll();

    if (!evList.length) return res.status(404).json({ error: 'Evento não encontrado.' });
    const event = evList[0];

    const { resources: parts } = await participationsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.eventId = @eid AND c.userId = @uid',
        parameters: [{ name: '@eid', value: req.params.id }, { name: '@uid', value: req.user.id }],
      }).fetchAll();

    if (!parts.length) return res.status(404).json({ error: 'Não estás inscrito neste evento.' });

    await participationsContainer.item(parts[0].id, parts[0].eventId).delete();
    await eventsContainer.item(event.id, event.id).replace({
      ...event,
      currentParticipants: Math.max(0, event.currentParticipants - 1),
    });

    res.json({ message: 'Inscrição cancelada.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:id/participants — listar participantes
router.get('/:id/participants', authMiddleware, async (req, res, next) => {
  try {
    const participationsContainer = req.app.locals.db.participations;
    const usersContainer          = req.app.locals.db.users;

    const { resources: parts } = await participationsContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.eventId = @id', parameters: [{ name: '@id', value: req.params.id }] })
      .fetchAll();

    // Obter info dos utilizadores
    const participants = await Promise.all(parts.map(async (p) => {
      const { resources: users } = await usersContainer.items
        .query({ query: 'SELECT c.id, c.username, c.fullName, c.city, c.avatarUrl, c.avgRating FROM c WHERE c.id = @uid', parameters: [{ name: '@uid', value: p.userId }] })
        .fetchAll();
      return { ...p, user: users[0] || null };
    }));

    res.json(participants);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
