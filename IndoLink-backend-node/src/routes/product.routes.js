const { Router } = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { configureCloudinaryFromEnv } = require('../config/cloudinary');
const controller = require('../controllers/product.controller');
const { protect, requireRoles } = require('../middleware/auth');

const router = Router();

// Configure Cloudinary storage for multer
const cloudinary = configureCloudinaryFromEnv();
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const original = file.originalname || `file${Date.now()}`;
    const ext = path.extname(original).toLowerCase();
    const base = path
      .basename(original, ext)
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
    return {
      folder: 'indolink/uploads',
      public_id: `${Date.now()}-${base}`,
      resource_type: 'image',
      format: ext ? ext.replace('.', '') : undefined,
      use_filename: true,
      unique_filename: false,
      overwrite: false,
    };
  },
});
const upload = multer({ storage });

router.get('/categories', controller.listCategories);
router.get('/categories/', controller.listCategories);
router.post('/categories', protect, requireRoles('ADMIN'), controller.createCategory);
router.post('/categories/', protect, requireRoles('ADMIN'), controller.createCategory);

router.get('/seller-products', protect, requireRoles('SELLER', 'ADMIN'), controller.getSellerProducts);
router.get('/seller-products/', protect, requireRoles('SELLER', 'ADMIN'), controller.getSellerProducts);
router.get('/buyer-products', controller.getBuyerProducts);
router.get('/buyer-products/', controller.getBuyerProducts);
router.get('/admin-products', protect, requireRoles('ADMIN'), controller.getAdminProducts);
router.get('/admin-products/', protect, requireRoles('ADMIN'), controller.getAdminProducts);
router.post('/:id/admin-purchase', protect, requireRoles('ADMIN'), controller.adminPurchaseProduct);
router.post('/:id/admin-purchase/', protect, requireRoles('ADMIN'), controller.adminPurchaseProduct);
router.post('/:id/admin-relist', protect, requireRoles('ADMIN'), controller.adminRelistProduct);
router.post('/:id/admin-relist/', protect, requireRoles('ADMIN'), controller.adminRelistProduct);
router.get('/seller/stats', protect, requireRoles('SELLER'), controller.getSellerStats);
router.get('/seller/stats/', protect, requireRoles('SELLER'), controller.getSellerStats);

router.post('/:id/images', protect, requireRoles('SELLER', 'ADMIN'), upload.single('image'), controller.uploadProductImage);
router.post('/:id/images/', protect, requireRoles('SELLER', 'ADMIN'), upload.single('image'), controller.uploadProductImage);
router.delete('/:id/images/:imageId', protect, requireRoles('SELLER', 'ADMIN'), controller.deleteProductImage);
router.delete('/:id/images/:imageId/', protect, requireRoles('SELLER', 'ADMIN'), controller.deleteProductImage);

router.get('/', controller.listProducts);
router.get('/', controller.listProducts);
router.post('/', protect, requireRoles('SELLER', 'ADMIN'), upload.single('image'), controller.createProduct);
router.post('/', protect, requireRoles('SELLER', 'ADMIN'), upload.single('image'), controller.createProduct);
router.get('/:id', controller.getProductById);
router.get('/:id/', controller.getProductById);

// Optional: delete product to match frontend attempt
router.delete('/:id', protect, requireRoles('SELLER', 'ADMIN'), async (req, res, next) => {
  try {
    const deleted = await require('../models/product.model').findByIdAndDelete(req.params.id);
    if (!deleted) return next(require('http-errors')(404, 'Product not found'));
    return require('../utils/response').sendSuccess(res, { deleted: true });
  } catch (err) { next(err); }
});
router.delete('/:id/', protect, requireRoles('SELLER', 'ADMIN'), async (req, res, next) => {
  try {
    const deleted = await require('../models/product.model').findByIdAndDelete(req.params.id);
    if (!deleted) return next(require('http-errors')(404, 'Product not found'));
    return require('../utils/response').sendSuccess(res, { deleted: true });
  } catch (err) { next(err); }
});

// Update endpoint (PATCH) for editing product
router.patch('/:id', protect, requireRoles('SELLER', 'ADMIN'), upload.single('image'), controller.updateProduct);
router.patch('/:id/', protect, requireRoles('SELLER', 'ADMIN'), upload.single('image'), controller.updateProduct);

// Relist product endpoint for sellers
router.post('/:id/relist', protect, requireRoles('SELLER'), controller.relistProduct);
router.post('/:id/relist/', protect, requireRoles('SELLER'), controller.relistProduct);

// Image search endpoint
router.post('/search-by-image', upload.single('image'), controller.searchByImage);

module.exports = router;


