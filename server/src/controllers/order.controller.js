const db = require('../../config/firebase');

// USER - creare comandă
const createOrder = async (req, res, next) => {
  try {
    const { products } = req.body;

    if (!products || !products.length) {
      return res.status(400).json({ message: 'Comanda este goală' });
    }

    const order = {
      userId: req.user.uid,
      products,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('orders').add(order);

    res.status(201).json({
      id: docRef.id,
      ...order
    });
  } catch (error) {
    next(error);
  }
};

// ADMIN - listare comenzi
const getAllOrders = async (req, res, next) => {
  try {
    const snapshot = await db.collection('orders').get();

    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getAllOrders
};
