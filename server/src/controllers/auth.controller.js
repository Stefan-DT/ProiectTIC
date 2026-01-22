const { db } = require('../../config/firebase');

const syncUser = async (req, res, next) => {
  try {
    const { uid, email } = req.user;

    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      await userRef.set({
        email,
        role: 'user',
        budget: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      const data = doc.data() || {};
      // Backfill budget for older users.
      if (data.budget === undefined) {
        await userRef.set(
          {
            budget: 0,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    }

    res.status(200).json({ message: 'User synchronized' });
  } catch (error) {
    next(error);
  }
};

const updateBudget = async (req, res, next) => {
  try {
    const { budget } = req.body;
    const nextBudget = Number(budget);

    if (!Number.isFinite(nextBudget) || nextBudget < 0) {
      return res.status(400).json({ message: 'Invalid budget' });
    }

    const userRef = db.collection('users').doc(req.user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    await userRef.set(
      {
        budget: nextBudget,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    res.status(200).json({ budget: nextBudget });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  syncUser,
  updateBudget
};
