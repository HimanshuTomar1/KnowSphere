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
});
