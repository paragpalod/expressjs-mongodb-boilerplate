require('colors');

// application configuration details
const { port } = require('./config');
const swaggerUi = require('./config/swagger');

// middleware for the entire application imported from middleware folder
const { authorization } = require('./middleware/auth');
const morgonMiddleware = require('./middleware/morgon');
const authRoutes = require('./routes/auth');
const routes = require('./routes/api');

// express app configuration
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

// allowing cors for all api calls
const cors = require('cors');
app.use(cors());

app.use(morgonMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(port, () => console.log(`Server listening at http://localhost:${port}`));

app.use('/', authRoutes);
app.use('/api', authorization, routes);
app.use('/documentation', swaggerUi);
app.get('*', (req, res) => {
  res.send({ message: 'Route not found' }, 404);
});
