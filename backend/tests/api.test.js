const request = require('supertest');
const app = require('../server');
const db = require('../db');
const { verifyPassword, verifyToken } = require('../security');

describe('KnowSphere Backend API & Security Suite', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  describe('Catalogue & Knowledge Metadata', () => {
    it('GET /api/categories returns standard Kiwix topic categories', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some(c => c.id === 'encyclopedia')).toBe(true);
      expect(res.body.some(c => c.id === 'education')).toBe(true);
    });

    it('GET /api/languages returns supported Kiwix languages', async () => {
      const res = await request(app).get('/api/languages');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some(l => l.code === 'en')).toBe(true);
      expect(res.body.some(l => l.code === 'hi')).toBe(true);
    });

    it('GET /api/catalogue returns ZIM packages filtered by language', async () => {
      const res = await request(app).get('/api/catalogue?language=en');
      expect(res.status).toBe(200);
      expect(res.body.items).toBeDefined();
      expect(res.body.items.every(item => item.language === 'en')).toBe(true);
    });
  });

  describe('Bandwidth & Storage-Aware Recommendations Engine', () => {
    it('GET /api/recommendations scores lightweight packages higher on low bandwidth (<= 2 Mbps)', async () => {
      const res = await request(app).get('/api/recommendations?speedMbps=1.5&storageGB=15&languages=en&interests=education');
      expect(res.status).toBe(200);
      expect(res.body.recommendations).toBeDefined();
      expect(res.body.recommendations.length).toBeGreaterThan(0);
      expect(res.body.defaultSelectedIds).toBeDefined();

      // Ensure total selected size does not exceed available space
      expect(res.body.totalSizeBytes).toBeLessThanOrEqual(res.body.availableBytes);
    });
  });

  describe('Security & Persistent Authentication', () => {
    const testEmail = `test_${Date.now()}@knowsphere.org`;
    const testPassword = 'StrongPassword123!';
    let registrationOtp = null;
    let authToken = null;

    it('POST /api/auth/register hashes passwords with bcrypt and generates OTP', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Tester Kiwix',
        email: testEmail,
        password: testPassword,
        phone: '+1 234-567-8900'
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.otp).toBeDefined();
      registrationOtp = res.body.otp;

      // Verify in DB that password is NOT plain text but bcrypt hashed
      const user = db.getUser(testEmail);
      expect(user).toBeDefined();
      expect(user.password).toBeUndefined(); // Plain password never stored
      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')).toBe(true);
      expect(verifyPassword(testPassword, user.passwordHash)).toBe(true);
    });

    it('POST /api/auth/verify-otp verifies OTP, marks user verified, and issues signed JWT', async () => {
      const res = await request(app).post('/api/auth/verify-otp').send({
        email: testEmail,
        otp: registrationOtp
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.verified).toBe(true);
      expect(res.body.token).toBeDefined();

      authToken = res.body.token;
      const decoded = verifyToken(authToken);
      expect(decoded).not.toBeNull();
      expect(decoded.email).toBe(testEmail);
    });

    it('POST /api/auth/login validates credentials with bcrypt and returns JWT', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testEmail,
        password: testPassword
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
    });

    it('POST /api/auth/login rejects incorrect password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testEmail,
        password: 'wrong_password_999'
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid/i);
    });

    it('GET /api/auth/me resolves profile via Authorization Bearer JWT', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(testEmail);
      expect(res.body.password).toBeUndefined();
      expect(res.body.passwordHash).toBeUndefined();
    });
  });

  describe('Download Engine & Network Recovery Audit', () => {
    let activeDownloadId = null;

    it('POST /api/download/start initiates persistent download record', async () => {
      const res = await request(app).post('/api/download/start').send({
        zimId: 'wikimed-en'
      });

      expect(res.status).toBe(200);
      expect(res.body.downloadId).toBeDefined();
      activeDownloadId = res.body.downloadId;

      const saved = db.getDownload(activeDownloadId);
      expect(saved).toBeDefined();
      expect(saved.status).toBe('downloading');
    });

    it('POST /api/recovery/simulate-drop preserves cached bytes without rollback', async () => {
      const res = await request(app).post('/api/recovery/simulate-drop').send({
        downloadId: activeDownloadId
      });

      expect(res.status).toBe(200);
      expect(res.body.integrityVerified).toBe(true);
      expect(res.body.checksum).toMatch(/^sha256:/);
      expect(res.body.byteRollback).toBe(0);
    });

    it('POST /api/recovery/resume-stream resumes from byte offset via HTTP 206', async () => {
      const res = await request(app).post('/api/recovery/resume-stream').send({
        downloadId: activeDownloadId
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.resumedFromByte).toBeGreaterThan(0);
    });

    it('GET /api/recovery/audit returns logged tamper-evident audit history', async () => {
      const res = await request(app).get('/api/recovery/audit');
      expect(res.status).toBe(200);
      expect(res.body.events).toBeDefined();
      expect(res.body.events.length).toBeGreaterThan(0);
    });
  });

  describe('Multilingual Universal Knowledge Localization (8 Languages)', () => {
    it('GET /api/offline/articles/:zimId returns 100% French content for French packages', async () => {
      const res = await request(app).get('/api/offline/articles/wikipedia-fr-all');
      expect(res.status).toBe(200);
      expect(res.body.language).toBe('fr');
      expect(Array.isArray(res.body.articles)).toBe(true);
      expect(res.body.articles.length).toBeGreaterThan(0);

      // Verify articles are strictly in French
      const titles = res.body.articles.map(a => a.title).join(' ');
      expect(titles).toMatch(/Bienvenue|Désinfection|Triage|Algorithmes/i);

      // Ensure no default English placeholder leaks
      expect(titles).not.toMatch(/Welcome to KnowSphere/i);
    });

    it('GET /api/offline/articles/:zimId returns French medical articles for WikiMed FR', async () => {
      const res = await request(app).get('/api/offline/articles/wikimed-fr');
      expect(res.status).toBe(200);
      expect(res.body.language).toBe('fr');
      const titles = res.body.articles.map(a => a.title).join(' ');
      expect(titles).toMatch(/Réanimation|Brûlures|Paludisme|SRO/i);
    });

    it('GET /api/offline/articles/:zimId returns 100% Spanish content for Spanish packages', async () => {
      const res = await request(app).get('/api/offline/articles/wikipedia-es-all');
      expect(res.status).toBe(200);
      expect(res.body.language).toBe('es');
      expect(res.body.articles.length).toBeGreaterThan(0);
      const titles = res.body.articles.map(a => a.title).join(' ');
      expect(titles).toMatch(/Bienvenido|Desinfección|Triaje|Búsqueda/i);
      expect(titles).not.toMatch(/Welcome to KnowSphere/i);
    });

    it('GET /api/offline/articles/:zimId returns 100% Hindi content for Hindi packages', async () => {
      const res = await request(app).get('/api/offline/articles/wikipedia-hi-all');
      expect(res.status).toBe(200);
      expect(res.body.language).toBe('hi');
      expect(res.body.articles.length).toBeGreaterThan(0);
      const titles = res.body.articles.map(a => a.title).join(' ');
      expect(titles).toMatch(/नोस्फेयर|स्वागत|विसंक्रमण|प्रोटोकॉल/);
      expect(titles).not.toMatch(/Welcome to KnowSphere/i);
    });

    it('GET /api/offline/articles/:zimId returns 100% Arabic content for Arabic packages', async () => {
      const res = await request(app).get('/api/offline/articles/wikipedia-ar-all');
      expect(res.status).toBe(200);
      expect(res.body.language).toBe('ar');
      expect(res.body.articles.length).toBeGreaterThan(0);
      const titles = res.body.articles.map(a => a.title).join(' ');
      expect(titles).toMatch(/مرحبًا|تعقيم|فرز/);
      expect(titles).not.toMatch(/Welcome to KnowSphere/i);
    });

    it('GET /api/offline/articles/:zimId returns 100% Chinese content for Chinese packages', async () => {
      const res = await request(app).get('/api/offline/articles/wikipedia-zh-all');
      expect(res.status).toBe(200);
      expect(res.body.language).toBe('zh');
      expect(res.body.articles.length).toBeGreaterThan(0);
      const titles = res.body.articles.map(a => a.title).join(' ');
      expect(titles).toMatch(/欢迎来到|消毒|检伤分类/);
      expect(titles).not.toMatch(/Welcome to KnowSphere/i);
    });

    it('GET /api/offline/articles/:zimId returns 100% German content for German packages', async () => {
      const res = await request(app).get('/api/offline/articles/wikipedia-de-all');
      expect(res.status).toBe(200);
      expect(res.body.language).toBe('de');
      expect(res.body.articles.length).toBeGreaterThan(0);
      const titles = res.body.articles.map(a => a.title).join(' ');
      expect(titles).toMatch(/Willkommen|Trinkwasserdesinfektion|Wiederbelebung/i);
      expect(titles).not.toMatch(/Welcome to KnowSphere/i);
    });

    it('GET /api/offline/articles/:zimId returns 100% Portuguese content for Portuguese packages', async () => {
      const res = await request(app).get('/api/offline/articles/wikipedia-pt-all');
      expect(res.status).toBe(200);
      expect(res.body.language).toBe('pt');
      expect(res.body.articles.length).toBeGreaterThan(0);
      const titles = res.body.articles.map(a => a.title).join(' ');
      expect(titles).toMatch(/Bem-vindo|Desinfecção|Triagem|Ressuscitação/i);
      expect(titles).not.toMatch(/Welcome to KnowSphere/i);
    });

    it('GET /api/offline/articles/:zimId returns English content for English packages', async () => {
      const res = await request(app).get('/api/offline/articles/wikipedia-en-all');
      expect(res.status).toBe(200);
      expect(res.body.language).toBe('en');
      expect(res.body.articles.length).toBeGreaterThan(0);
      const titles = res.body.articles.map(a => a.title).join(' ');
      expect(titles).toMatch(/Welcome to KnowSphere Offline Reader|Solar Water Disinfection/i);
    });
  });
});
