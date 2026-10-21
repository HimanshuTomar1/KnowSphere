const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'knowsphere-kiwix-secure-jwt-secret-2026';
const JWT_EXPIRES_IN = '7d';

/**
 * Hash a plain text password using bcrypt
 */
function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

/**
 * Verify a plain text password against a hash or legacy seed
 */
function verifyPassword(plainPassword, passwordHash) {
  if (!passwordHash) return false;
  // If stored as bcrypt hash
  if (passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$')) {
    return bcrypt.compareSync(plainPassword, passwordHash);
  }
  // Fallback for unhashed legacy records
  return plainPassword === passwordHash;
}

/**
 * Generate a signed JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Express middleware to authenticate JWT token
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication token is required.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid Authorization header format. Expected Bearer <token>' });
  }

  const decoded = verifyToken(parts[1]);
  if (!decoded) {
    return res.status(401).json({ error: 'Token is invalid or expired.' });
  }

  req.user = decoded;
  next();
}

/**
 * Sanitize user object to remove secret credentials before sending to client
 */
function sanitizeUser(user) {
  if (!user) return null;
  const { password, passwordHash, ...cleanUser } = user;
  return cleanUser;
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  requireAuth,
  sanitizeUser,
  JWT_SECRET
};
