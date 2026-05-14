const express = require('express');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/products ────────────────────────────────────────────────────────
// Public – anyone can view products
router.get('/', async (_req, res) => {
  try {
    const products = await Product.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error('[GET /products]', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── POST /api/products ───────────────────────────────────────────────────────
// Protected – only logged-in users
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, price, imageUrl } = req.body;

    if (!title || !description || price == null || !imageUrl)
      return res.status(400).json({ message: 'All fields are required.' });

    const product = await Product.create({
      title,
      description,
      price,
      imageUrl,
      createdBy: req.user._id,
    });

    await product.populate('createdBy', 'name email');

    res.status(201).json(product);
  } catch (err) {
    console.error('[POST /products]', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
