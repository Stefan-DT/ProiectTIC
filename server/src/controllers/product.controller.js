const { db } = require('../../config/firebase');

const ALLOWED_REVIEW_RATINGS = [1, 2, 3, 4, 5];

function isNonNegativeInt(n) {
  return Number.isInteger(n) && n >= 0;
}

function normalizeActivationCodes(input) {
  if (input === undefined) return undefined;
  if (!Array.isArray(input)) return null;

  const cleaned = input
    .map((c) => String(c ?? '').trim())
    .filter(Boolean);

  const unique = Array.from(new Set(cleaned));

  return unique;
}

async function userHasPurchasedProduct(userId, productId) {
  const snap = await db
    .collection('orders')
    .where('userId', '==', userId)
    .limit(50)
    .get();

  if (snap.empty) return false;

  return snap.docs.some((d) => {
    const order = d.data() || {};
    const items = Array.isArray(order.products) ? order.products : [];
    return items.some((it) => String(it?.productId) === String(productId));
  });
}

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

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const docRef = db.collection('products').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({
      id: doc.id,
      ...doc.data()
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      price,
      category,
      imageUrl,
      stock,
      activationCodes
    } = req.body;
    if (!name || !price) {
      return res.status(400).json({
        message: 'name and price are required'
      });
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ message: 'price must be a number greater than 0' });
    }

    const stockTotal = stock?.total ?? 0;
    const numericStockTotal = Number(stockTotal);
    if (!isNonNegativeInt(numericStockTotal)) {
      return res.status(400).json({ message: 'stock.total must be an integer >= 0' });
    }

    const normalizedCodes = normalizeActivationCodes(activationCodes);
    if (normalizedCodes === null) {
      return res.status(400).json({ message: 'activationCodes must be an array of strings' });
    }
    if (normalizedCodes && normalizedCodes.length < numericStockTotal) {
      return res.status(400).json({
        message: 'activationCodes must contain at least as many unique codes as stock.total'
      });
    }

    const product = {
      name,
      price: numericPrice,
      type: 'game',
      imageUrl: imageUrl || null,
      category: category || { id: 'cat_general', name: 'General' },
      stock: { ...(stock || {}), total: numericStockTotal },
      activationCodes: normalizedCodes || [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    const docRef = await db.collection('products').add(product);

    res.status(201).json({
      id: docRef.id,
      ...product
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const docRef = db.collection('products').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const currentData = doc.data() || {};

    // Validate price if provided
    if (updates?.price !== undefined) {
      const numericPrice = Number(updates.price);
      if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({ message: 'price must be a number greater than 0' });
      }
      updates.price = numericPrice;
    }

    // Validate activationCodes if provided (array of unique, trimmed strings)
    const normalizedCodes = normalizeActivationCodes(updates?.activationCodes);
    if (normalizedCodes === null) {
      return res.status(400).json({ message: 'activationCodes must be an array of strings' });
    }
    if (normalizedCodes !== undefined) {
      updates.activationCodes = normalizedCodes;
    }

    // Validate stock.total if provided and keep it consistent with codes
    let nextStockTotal = currentData?.stock?.total ?? 0;
    if (updates?.stock?.total !== undefined) {
      const numericStockTotal = Number(updates.stock.total);
      if (!isNonNegativeInt(numericStockTotal)) {
        return res.status(400).json({ message: 'stock.total must be an integer >= 0' });
      }
      nextStockTotal = numericStockTotal;
      updates.stock = { ...(currentData.stock || {}), ...(updates.stock || {}), total: numericStockTotal };
    }

    const nextCodes = normalizedCodes !== undefined
      ? normalizedCodes
      : (Array.isArray(currentData.activationCodes) ? currentData.activationCodes : []);

    if (Array.isArray(nextCodes) && nextCodes.length < Number(nextStockTotal)) {
      return res.status(400).json({
        message: 'activationCodes must contain at least as many unique codes as stock.total'
      });
    }

    await docRef.update({
      ...updates,
      type: 'game',
      'metadata.updatedAt': new Date().toISOString()
    });

    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const docRef = db.collection('products').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await docRef.delete();

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Reviews
const getProductReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const productRef = db.collection('products').doc(id);
    const productSnap = await productRef.get();

    if (!productSnap.exists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const snap = await productRef
      .collection('reviews')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();

    const reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    res.status(200).json(reviews);
  } catch (error) {
    next(error);
  }
};

const getMyProductReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const ref = db.collection('products').doc(id).collection('reviews').doc(userId);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    next(error);
  }
};

const upsertMyProductReview = async (req, res, next) => {
  try {
    const { id } = req.params; 
    const userId = req.user.uid;
    const userEmail = req.user.email || null;

    const { rating, comment } = req.body || {};
    const r = Number(rating);
    const c = String(comment ?? '').trim();

    if (!ALLOWED_REVIEW_RATINGS.includes(r)) {
      return res.status(400).json({ message: 'Rating must be an integer from 1 to 5.' });
    }

    if (c.length < 3 || c.length > 1000) {
      return res
        .status(400)
        .json({ message: 'Comment must be between 3 and 1000 characters.' });
    }

    const purchased = await userHasPurchasedProduct(userId, id);
    if (!purchased) {
      return res.status(403).json({ message: 'You can only review products you purchased.' });
    }

    const productRef = db.collection('products').doc(id);
    const reviewRef = productRef.collection('reviews').doc(userId);

    const now = new Date().toISOString();

    const payload = await db.runTransaction(async (t) => {
      const productSnap = await t.get(productRef);
      if (!productSnap.exists) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
      }

      const existingReviewSnap = await t.get(reviewRef);
      const prevRating = existingReviewSnap.exists
        ? Number(existingReviewSnap.data()?.rating ?? 0)
        : null;

      const productData = productSnap.data() || {};
      const summary = productData.ratingSummary || {};
      const prevCount = Number(summary.count ?? 0);
      const prevSum = Number(summary.sum ?? 0);

      let nextCount = prevCount;
      let nextSum = prevSum;

      if (prevRating === null) {
        nextCount = prevCount + 1;
        nextSum = prevSum + r;
      } else if (Number.isFinite(prevRating)) {
        nextSum = prevSum - prevRating + r;
      } else {
        nextCount = prevCount + 1;
        nextSum = prevSum + r;
      }

      const avg = nextCount > 0 ? Number((nextSum / nextCount).toFixed(2)) : 0;

      const reviewPayload = {
        productId: id,
        userId,
        userEmail,
        rating: r,
        comment: c,
        updatedAt: now,
        ...(existingReviewSnap.exists ? {} : { createdAt: now })
      };

      t.set(reviewRef, reviewPayload, { merge: true });
      t.update(productRef, {
        ratingSummary: {
          count: nextCount,
          sum: Number(nextSum.toFixed(2)),
          avg
        },
        'metadata.updatedAt': now
      });

      return reviewPayload;
    });

    res.status(200).json({ id: userId, ...payload });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductReviews,
  getMyProductReview,
  upsertMyProductReview
};
