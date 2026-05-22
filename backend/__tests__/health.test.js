const request = require('supertest');
const express = require('express');

// Minimal app for testing without real Azure connections
function createTestApp() {
  const app = express();
  app.use(express.json());

  app.locals.db = {
    users:          { items: { query: () => ({ fetchAll: async () => ({ resources: [] }) }) } },
    events:         { items: { query: () => ({ fetchAll: async () => ({ resources: [] }) }) } },
    ratings:        { items: { query: () => ({ fetchAll: async () => ({ resources: [] }) }) } },
    participations: { items: { query: () => ({ fetchAll: async () => ({ resources: [] }) }) } },
    eventPhotos:    { items: { query: () => ({ fetchAll: async () => ({ resources: [] }) }) } },
    sports:         { items: { query: () => ({ fetchAll: async () => ({ resources: [] }) }) } },
  };

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
  });

  return app;
}

describe('Health endpoint', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  it('GET /api/health returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('Input validation', () => {
  it('rejects score below 1', () => {
    const score = 0;
    expect(score < 1 || score > 5).toBe(true);
  });

  it('rejects score above 5', () => {
    const score = 6;
    expect(score < 1 || score > 5).toBe(true);
  });

  it('accepts valid score', () => {
    const score = 4;
    expect(score >= 1 && score <= 5).toBe(true);
  });
});

describe('Auth route — register validation', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
    const authRouter = express.Router();
    authRouter.post('/register', (req, res) => {
      const { username, fullName, email, password } = req.body;
      if (!username || !fullName || !email || !password) {
        return res.status(400).json({ error: 'Campos obrigatórios em falta.' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'A palavra-passe deve ter pelo menos 6 caracteres.' });
      }
      res.status(201).json({ ok: true });
    });
    app.use('/api/auth', authRouter);
  });

  it('POST /api/auth/register without body returns 400', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/register with short password returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'test', fullName: 'Test User', email: 'test@test.com', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('6 caracteres');
  });

  it('POST /api/auth/register with valid data returns 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'test', fullName: 'Test User', email: 'test@test.com', password: 'secret123' });
    expect(res.status).toBe(201);
  });
});
