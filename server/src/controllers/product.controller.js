const { db } = require('../../config/firebase');

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
      type,
      category,
      imageUrl,
      stock,
      activationCodes
    } = req.body;
    if (!name || !price || !type) {
      return res.status(400).json({
        message: 'name, price and type are required'
      });
    }

    const product = {
      name,
      price,
      type,
      imageUrl: imageUrl || null,
      category: category || { id: 'cat_general', name: 'General' },
      stock: stock || { total: 0 },
      activationCodes: type === 'game' ? activationCodes || [] : [],
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

    await docRef.update({
      ...updates,
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

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
