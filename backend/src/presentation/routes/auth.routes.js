const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { loginSchema, refreshTokenSchema } = require('../../application/validators/auth.validator');

/**
 * @param {import('../controllers/auth.controller')} authController - instantiated controller from container
 */
module.exports = (authController) => {
  const router = Router();

  /**
   * @swagger
   * /api/v1/auth/login:
   *   post:
   *     summary: Authenticate a user and issue access/refresh tokens
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email: { type: string, format: email }
   *               password: { type: string, format: password }
   *     responses:
   *       200: { description: Login successful }
   *       401: { description: Invalid credentials }
   */
  router.post('/login', validate(loginSchema), asyncHandler(authController.login));

  /**
   * @swagger
   * /api/v1/auth/refresh:
   *   post:
   *     summary: Exchange a valid refresh token for a new access/refresh token pair
   *     tags: [Auth]
   *     responses:
   *       200: { description: Token refreshed }
   *       401: { description: Invalid or expired refresh token }
   */
  router.post('/refresh', validate(refreshTokenSchema), asyncHandler(authController.refresh));

  /**
   * @swagger
   * /api/v1/auth/logout:
   *   post:
   *     summary: Revoke a refresh token
   *     tags: [Auth]
   *     responses:
   *       200: { description: Logged out successfully }
   */
  router.post('/logout', asyncHandler(authController.logout));

  /**
   * @swagger
   * /api/v1/auth/me:
   *   get:
   *     summary: Get the currently authenticated user's profile
   *     tags: [Auth]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Current user retrieved }
   *       401: { description: Not authenticated }
   */
  router.get('/me', authenticate, asyncHandler(authController.me));

  return router;
};
