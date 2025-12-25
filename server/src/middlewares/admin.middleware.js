const db = require('../../config/firebase');

const adminOnly = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ message: 'Acces interzis' });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = adminOnly;
