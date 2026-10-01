const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ms = require('ms');
const ITokenService = require('../../application/interfaces/ITokenService');
const env = require('../config/env');

class JwtTokenService extends ITokenService {
  signAccessToken(payload) {
    return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn });
  }

  signRefreshToken(payload) {
    return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn });
  }

  verifyAccessToken(token) {
    return jwt.verify(token, env.jwt.accessSecret);
  }

  verifyRefreshToken(token) {
    return jwt.verify(token, env.jwt.refreshSecret);
  }

  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  getRefreshTokenExpiry() {
    return new Date(Date.now() + ms(env.jwt.refreshExpiresIn));
  }
}

module.exports = new JwtTokenService();
