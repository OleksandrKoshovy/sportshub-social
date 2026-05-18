const express = require('express');
const multer  = require('multer');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Multer: armazenar em memória antes de enviar para o Blob Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Apenas são aceites ficheiros JPG, PNG e WEBP.'));
  },
});

// POST /api/upload/event-photo — carregar foto de evento
router.post('/event-photo', authMiddleware, upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum ficheiro enviado.' });
    }

    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ error: 'eventId é obrigatório.' });
    }

    // Verificar se o utilizador participou no evento
    const participationsContainer = req.app.locals.db.participations;
    const { resources: parts } = await participationsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.eventId = @eid AND c.userId = @uid',
        parameters: [
          { name: '@eid', value: eventId },
          { name: '@uid', value: req.user.id },
        ],
      }).fetchAll();

    if (!parts.length) {
      return res.status(403).json({ error: 'Só participantes podem adicionar fotos ao evento.' });
    }

    // Fazer upload para Azure Blob Storage
    const photosContainer = req.app.locals.photosContainer;
    const ext   = req.file.mimetype.split('/')[1];
    const blobName = `${eventId}/${uuidv4()}.${ext}`;
    const blockBlobClient = photosContainer.getBlockBlobClient(blobName);

    await blockBlobClient.upload(req.file.buffer, req.file.size, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });

    const photoUrl = blockBlobClient.url;

    // Guardar referência no Cosmos DB
    const eventPhotosContainer = req.app.locals.db.eventPhotos;
    const photoDoc = {
      id:           uuidv4(),
      eventId,
      uploadedBy:   req.user.id,
      blobName,
      url:          photoUrl,
      uploadedAt:   new Date().toISOString(),
    };
    await eventPhotosContainer.items.create(photoDoc);

    // Adicionar URL ao array de fotos do evento
    const eventsContainer = req.app.locals.db.events;
    const { resources: evList } = await eventsContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: eventId }] })
      .fetchAll();

    if (evList.length > 0) {
      const event = evList[0];
      await eventsContainer.item(event.id, event.id).replace({
        ...event,
        photoUrls: [...(event.photoUrls || []), photoUrl],
      });
    }

    res.status(201).json({ url: photoUrl, blobName });

  } catch (err) {
    next(err);
  }
});

// POST /api/upload/avatar — atualizar foto de perfil
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum ficheiro enviado.' });

    const avatarsContainer = req.app.locals.avatarsContainer;
    const ext = req.file.mimetype.split('/')[1];
    const blobName = `${req.user.id}/avatar.${ext}`;
    const blockBlobClient = avatarsContainer.getBlockBlobClient(blobName);

    await blockBlobClient.upload(req.file.buffer, req.file.size, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });

    const avatarUrl = blockBlobClient.url;

    // Atualizar avatarUrl no Cosmos DB
    const usersContainer = req.app.locals.db.users;
    const { resources: users } = await usersContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: req.user.id }] })
      .fetchAll();

    if (users.length > 0) {
      await usersContainer.item(users[0].id, users[0].id).replace({ ...users[0], avatarUrl });
    }

    res.json({ avatarUrl });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
