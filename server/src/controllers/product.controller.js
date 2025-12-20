const db = require('../../config/firebase');

const getAllProducts = async (req, res, next) => {
  try {
    const snapshot = await db.collection('products').get();

    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts
};
