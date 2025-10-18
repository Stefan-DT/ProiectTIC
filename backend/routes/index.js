const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'API Express initialized successfully 🚀' });
});

module.exports = router;