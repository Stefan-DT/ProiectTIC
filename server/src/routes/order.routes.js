const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const adminOnly = require('../middlewares/admin.middleware');

const {
  createOrder,
  getAllOrders,
  getUserOrders
} = require('../controllers/order.controller');

// user - create order
router.post('/', authMiddleware, createOrder);

// user - own orders
router.get('/my', authMiddleware, getUserOrders);

// admin - all orders
router.get('/', authMiddleware, adminOnly, getAllOrders);

module.exports = router;
