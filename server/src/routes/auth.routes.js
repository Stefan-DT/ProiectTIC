const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const { syncUser } = require('../controllers/auth.controller');

router.post('/sync', authMiddleware, syncUser);

module.exports = router;
