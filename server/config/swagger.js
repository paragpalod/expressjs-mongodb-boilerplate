const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const router = require('express').Router();

// Swagger set up
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Resonate Server',
    version: '2.0.0',
    description: 'Resonate server Documentation for Game APIs and Dashboard APIs with their schemas'
  },
  consumes: [
    'application/json'
  ],
  produces: [
    'application/json'
  ],
  servers: [
    {
      url: 'http://localhost:9000/'
    }
  ]
};

const apis = [
  'server/routes/auth.js',
  'server/routes/api/administrator/example.js'
];

const specs = swaggerJsdoc({
  swaggerDefinition,
  apis
});
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(specs, { explorer: true }));

module.exports = router;
