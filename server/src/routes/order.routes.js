const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const adminOnly = require('../middlewares/admin.middleware');

const {
  createOrder,
  getAllOrders
} = require('../controllers/order.controller');

// user
router.post('/', authMiddleware, createOrder);

// admin
router.get('/', authMiddleware, adminOnly, getAllOrders);

module.exports = router;
