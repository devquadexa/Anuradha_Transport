const { UnauthorizedError } = require('../../domain/errors');
const tokenService = require('../../infrastructure/auth/JwtTokenService');

/**
 * Verifies the JWT access token from the Authorization header and attaches
 * the decoded payload (id, email, role, permissions) to req.user.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = tokenService.verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions || [],
    };
    return next();
  } catch (err) {
    return next(new UnauthorizedError('Invalid or expired access token'));
  }
}

module.exports = authenticate;
