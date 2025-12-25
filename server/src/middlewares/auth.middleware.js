const admin = require('firebase-admin');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token lipsă' });
    }

    const token = authHeader.split(' ')[1];

    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalid' });
  }
};

module.exports = authMiddleware;
