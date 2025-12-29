const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const { syncUser } = require('../controllers/auth.controller');
const db = require('../../config/firebase');

// sincronizare user
router.post('/sync', authMiddleware, syncUser);

// user curent
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User inexistent' });
    }

    res.status(200).json(userDoc.data());
  } catch (error) {
    next(error);
  }
});

module.exports = router;
