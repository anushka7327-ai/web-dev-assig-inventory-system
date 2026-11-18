const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');

// POST /api/products
exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

// GET /api/products?category=&supplier=&search=&minPrice=&maxPrice=&inStock=&sort=&page=&limit=
exports.getProducts = asyncHandler(async (req, res) => {
  const { category, supplier, search, minPrice, maxPrice, inStock, sort } = req.query;

  const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const filter = {};
  if (category) filter.category = new RegExp(`^${escape(category)}$`, 'i');
  if (supplier) filter.supplier = new RegExp(escape(supplier), 'i');
  if (search) filter.name = new RegExp(escape(search), 'i');
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (inStock === 'true') filter.quantity = { $gt: 0 };

  // sort=-price,name  ->  "-price name"
  const sortBy = sort ? sort.split(',').join(' ') : '-createdAt';

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter).sort(sortBy).skip(skip).limit(limit),
  ]);

  res.json({
    total,
    page,
    totalPages: Math.ceil(total / limit),
    count: products.length,
    products,
  });
});

// GET /api/products/:id
exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json(product);
});

// PUT /api/products/:id
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json(product);
});

// PATCH /api/products/:id/stock   body: { "change": 10 } or { "change": -3 }
exports.adjustStock = asyncHandler(async (req, res) => {
  const change = Number(req.body.change);
  if (!Number.isInteger(change) || change === 0) {
    res.status(400);
    throw new Error('"change" must be a non-zero integer (positive = restock, negative = sale)');
  }

  // Atomic update: for a sale, only match if enough stock exists
  const filter = { _id: req.params.id };
  if (change < 0) filter.quantity = { $gte: Math.abs(change) };

  const product = await Product.findOneAndUpdate(
    filter,
    { $inc: { quantity: change } },
    { new: true }
  );

  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    res.status(exists ? 400 : 404);
    throw new Error(exists ? 'Insufficient stock for this sale' : 'Product not found');
  }

  res.json({ message: 'Stock updated', product });
});

// DELETE /api/products/:id
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ message: 'Product deleted', id: product.id });
});

// GET /api/products/low-stock   (quantity <= reorderLevel)
exports.getLowStock = asyncHandler(async (req, res) => {
  const lowStockItems = await Product.find({
    $expr: { $lte: ['$quantity', '$reorderLevel'] },
  }).sort('quantity');

  res.json({ count: lowStockItems.length, lowStockItems });
});

// GET /api/products/summary   (aggregation)
exports.getSummary = asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
        avgPrice: { $avg: '$price' },
      },
    },
    { $project: { totalItems: 1, totalQuantity: 1, totalStockValue: 1, avgPrice: { $round: ['$avgPrice', 2] } } },
    { $sort: { totalStockValue: -1 } },
  ]);

  res.json({ categories: summary.length, summary });
});
