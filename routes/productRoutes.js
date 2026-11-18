const express = require('express');
const c = require('../controllers/productController');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();

// Static routes MUST come before "/:id", otherwise "low-stock" is treated as an ID
router.get('/low-stock', c.getLowStock);
router.get('/summary', c.getSummary);

router.route('/').get(c.getProducts).post(c.createProduct);

router.patch('/:id/stock', validateObjectId, c.adjustStock);
router
  .route('/:id')
  .get(validateObjectId, c.getProductById)
  .put(validateObjectId, c.updateProduct)
  .delete(validateObjectId, c.deleteProduct);

module.exports = router;
