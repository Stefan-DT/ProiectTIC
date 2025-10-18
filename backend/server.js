const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const routes = require('./routes/index');
const { errorHandler } = require('./middleware/errorHandler');
const { logger } = require('./middleware/logger');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(morgan('dev'));
app.use(logger);
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is on');
});

app.use('/api', routes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
