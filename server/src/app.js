const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const productRoutes = require('./routes/product.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/products', productRoutes);

app.get('/api/test', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Game Store API is running'
  });
});

module.exports = app;
