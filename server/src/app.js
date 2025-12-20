const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/test', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running'
  });
});

module.exports = app;
