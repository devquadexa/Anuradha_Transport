const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Anuradha Transport - TMS API',
      version: '1.0.0',
      description:
        'RESTful API for the Anuradha Transport Management System. Clean Architecture backend (Domain, Application, Infrastructure, Presentation).',
    },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [path.join(__dirname, '..', 'routes', '*.routes.js')],
};

module.exports = swaggerJsdoc(options);
