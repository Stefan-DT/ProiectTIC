const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const adminOnly = require('../middlewares/admin.middleware');

const {
  createOrder,
  getAllOrders,
  getUserOrders,
  updateOrderStatus
} = require('../controllers/order.controller');

// user - create order
router.post('/', authMiddleware, createOrder);

// user - own orders
router.get('/my', authMiddleware, getUserOrders);

// admin - update status
router.patch('/:id/status', authMiddleware, adminOnly, updateOrderStatus);

// admin - all orders
router.get('/', authMiddleware, adminOnly, getAllOrders);

module.exports = router;
