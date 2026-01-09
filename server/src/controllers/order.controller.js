const { db } = require('../../config/firebase');

// USER - create order
const createOrder = async (req, res, next) => {
  try {
    const { products } = req.body;

    if (!products || !products.length) {
      return res.status(400).json({ message: 'Order is empty' });
    }

    const enrichedProducts = [];

    for (const item of products) {
      const productRef = db.collection('products').doc(item.productId);

      const { assignedCodes } = await db.runTransaction(async (t) => {
        const productSnap = await t.get(productRef);

        if (!productSnap.exists) {
          const error = new Error('Product not found');
          error.statusCode = 404;
          throw error;
        }

        const productData = productSnap.data();
        const orderedQty = item.quantity || 1;
        const currentStock = productData.stock?.total ?? 0;

        if (currentStock < orderedQty) {
          const error = new Error('Not enough stock');
          error.statusCode = 400;
          throw error;
        }

        let activationCodes = productData.activationCodes || [];
        let codesToAssign = [];

        if (productData.type === 'game') {
          if (activationCodes.length < orderedQty) {
            const error = new Error('Not enough activation codes available');
            error.statusCode = 400;
            throw error;
          }

          codesToAssign = activationCodes.slice(0, orderedQty);
          const remainingCodes = activationCodes.slice(orderedQty);

          t.update(productRef, {
            'stock.total': currentStock - orderedQty,
            activationCodes: remainingCodes
          });
        } else {
          t.update(productRef, {
            'stock.total': currentStock - orderedQty
          });
        }

        return { assignedCodes: codesToAssign };
      });

      enrichedProducts.push({
        ...item,
        activationCodes: assignedCodes
      });
    }

    const order = {
      userId: req.user.uid,
      products: enrichedProducts,
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

const getUserOrders = async (req, res, next) => {
  try {
    const snapshot = await db
      .collection('orders')
      .where('userId', '==', req.user.uid)
      .get();

    const orders = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getUserOrders
};
