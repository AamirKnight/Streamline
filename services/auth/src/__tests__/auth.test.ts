import request from 'supertest';
import sequelize from '../database';
import User from '../models/user';

// Import app - we'll need to create this properly
let app: any;

beforeAll(async () => {
  // Dynamically import app to avoid side effects
  const appModule = await import('../index');
  app = appModule.default;
  
  // Sync database
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Auth Service', () => {
  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should reject duplicate email', async () => {
      // First create a user
      await User.create({
        email: 'duplicate@example.com',
        username: 'duplicate',
        passwordHash: 'hashedpassword',
      });

      // Try to register with same email
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          username: 'another',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already exists');
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          username: 'testuser',
          password: 'password123',
        });

      expect(res.status).toBe(400);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'test2@example.com',
          username: 'testuser2',
          password: 'short',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.service).toBe('auth');
    });
  });
});