const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const adminOnly = require('../middlewares/admin.middleware');

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductReviews,
  getMyProductReview,
  upsertMyProductReview
} = require('../controllers/product.controller');

router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Reviews
router.get('/:id/reviews', getProductReviews);
router.get('/:id/reviews/me', authMiddleware, getMyProductReview);
router.put('/:id/reviews/me', authMiddleware, upsertMyProductReview);

router.post('/', authMiddleware, adminOnly, createProduct);
router.put('/:id', authMiddleware, adminOnly, updateProduct);
router.delete('/:id', authMiddleware, adminOnly, deleteProduct);

module.exports = router;
