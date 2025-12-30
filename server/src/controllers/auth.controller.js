const db = require('../../config/firebase');

const syncUser = async (req, res, next) => {
  try {
    const { uid, email } = req.user;

    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      await userRef.set({
        email,
        role: 'user',
        createdAt: new Date().toISOString()
      });
    }

    res.status(200).json({ message: 'User synchronized' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  syncUser
};
