const { db } = require('../../config/firebase');

// USER - create order
const createOrder = async (req, res, next) => {
  try {
    const { products } = req.body;

    if (!products || !products.length) {
      return res.status(400).json({ message: 'Order is empty' });
    }

    const userId = req.user.uid;
    const userRef = db.collection('users').doc(userId);
    const orderRef = db.collection('orders').doc();
    const now = new Date().toISOString();

    const result = await db.runTransaction(async (t) => {
      const userSnap = await t.get(userRef);
      if (!userSnap.exists) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      const userData = userSnap.data() || {};
      const currentBudget = Number(userData.budget ?? 0);

      if (!Number.isFinite(currentBudget) || currentBudget < 0) {
        const error = new Error('Invalid user budget');
        error.statusCode = 400;
        throw error;
      }

      const enrichedProducts = [];
      let total = 0;

      for (const item of products) {
        if (!item?.productId) {
          const error = new Error('Invalid product');
          error.statusCode = 400;
          throw error;
        }

        const productRef = db.collection('products').doc(item.productId);
        const productSnap = await t.get(productRef);

        if (!productSnap.exists) {
          const error = new Error('Product not found');
          error.statusCode = 404;
          throw error;
        }

        const productData = productSnap.data() || {};
        const orderedQty = Math.max(1, Number(item.quantity || 1));
        const currentStock = Number(productData.stock?.total ?? 0);

        if (!Number.isFinite(orderedQty) || orderedQty < 1) {
          const error = new Error('Invalid quantity');
          error.statusCode = 400;
          throw error;
        }

        if (currentStock < orderedQty) {
          const error = new Error('Not enough stock');
          error.statusCode = 400;
          throw error;
        }

        const priceAtPurchase = Number(productData.price ?? 0);
        if (!Number.isFinite(priceAtPurchase) || priceAtPurchase < 0) {
          const error = new Error('Invalid product price');
          error.statusCode = 400;
          throw error;
        }

        const activationCodes = Array.isArray(productData.activationCodes)
          ? productData.activationCodes
          : [];

        if (activationCodes.length < orderedQty) {
          const error = new Error('Not enough activation codes available');
          error.statusCode = 400;
          throw error;
        }

        const codesToAssign = activationCodes.slice(0, orderedQty);
        const remainingCodes = activationCodes.slice(orderedQty);

        t.update(productRef, {
          'stock.total': currentStock - orderedQty,
          activationCodes: remainingCodes,
          'metadata.updatedAt': now
        });

        enrichedProducts.push({
          productId: productRef.id,
          name: productData.name ?? item.name ?? 'Unknown',
          priceAtPurchase,
          quantity: orderedQty,
          activationCodes: codesToAssign
        });

        total += priceAtPurchase * orderedQty;
      }

      if (currentBudget < total) {
        const error = new Error('Insufficient budget');
        error.statusCode = 400;
        throw error;
      }

      const remainingBudget = Number((currentBudget - total).toFixed(2));

      t.update(userRef, {
        budget: remainingBudget,
        updatedAt: now
      });

      const order = {
        userId,
        products: enrichedProducts,
        status: 'pending',
        createdAt: now,
        total
      };

      t.set(orderRef, order);

      return { orderId: orderRef.id, order, remainingBudget };
    });

    res.status(201).json({
      id: result.orderId,
      ...result.order,
      remainingBudget: result.remainingBudget
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
