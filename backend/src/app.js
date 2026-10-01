const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const env = require('./infrastructure/config/env');
const container = require('./container');
const buildRouter = require('./presentation/routes');
const swaggerSpec = require('./presentation/docs/swagger');
const errorHandler = require('./presentation/middleware/errorHandler');
const notFound = require('./presentation/middleware/notFound');

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors({ origin: env.cors.origin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
app.use(
  rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Health check (no auth, useful for load balancers/monitoring)
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', env: env.nodeEnv }));

// API docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use('/api/v1', buildRouter(container));

// 404 + centralized error handling (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
