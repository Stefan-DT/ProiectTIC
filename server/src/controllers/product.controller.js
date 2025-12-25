const db = require('../config/firebase');

// GET /api/products
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

// GET /api/products/:id
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const docRef = db.collection('products').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Produs inexistent' });
    }

    res.status(200).json({
      id: doc.id,
      ...doc.data()
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const { name, price, type, category } = req.body;

    // validare simplă
    if (!name || !price || !type) {
      return res.status(400).json({
        message: 'name, price și type sunt obligatorii'
      });
    }

    const product = {
      name,
      price,
      type,
      category: category || { id: 'cat_general', name: 'General' },
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

// PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const docRef = db.collection('products').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Produs inexistent' });
    }

    await docRef.update({
      ...updates,
      'metadata.updatedAt': new Date().toISOString()
    });

    res.status(200).json({ message: 'Produs actualizat cu succes' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const docRef = db.collection('products').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Produs inexistent' });
    }

    await docRef.delete();

    res.status(200).json({ message: 'Produs șters cu succes' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
