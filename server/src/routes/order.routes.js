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

router.post('/', authMiddleware, createOrder);

router.get('/my', authMiddleware, getUserOrders);

router.patch('/:id/status', authMiddleware, adminOnly, updateOrderStatus);

router.get('/', authMiddleware, adminOnly, getAllOrders);

module.exports = router;
