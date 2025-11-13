const express = require('express');
const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { configureCloudinaryFromEnv } = require('../config/cloudinary');
const router = express.Router();
const adminProductController = require('../controllers/adminProduct.controller');
const { protect, requireRoles } = require('../middleware/auth');

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
      folder: 'indolink/admin-products',
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

// All routes require ADMIN role
router.use(protect);
router.use(requireRoles('ADMIN'));

// GET /api/admin-products - Get all admin products
router.get('/', adminProductController.getAdminProducts);

// GET /api/admin-products/stats - Get admin product stats
router.get('/stats', adminProductController.getAdminProductStats);

// GET /api/admin-products/category/:categoryId - Get admin products by category
router.get('/category/:categoryId', adminProductController.getAdminProductsByCategory);

// GET /api/admin-products/:id - Get single admin product
router.get('/:id', adminProductController.getAdminProduct);

// PUT /api/admin-products/:id - Update admin product (with file upload support)
router.put('/:id', upload.single('image'), adminProductController.updateAdminProduct);

// POST /api/admin-products/:id/images - Upload image for admin product
router.post('/:id/images', upload.single('image'), adminProductController.uploadAdminProductImage);

// DELETE /api/admin-products/:id/images/:imageIndex - Delete image from admin product
router.delete('/:id/images/:imageIndex', adminProductController.deleteAdminProductImage);

// DELETE /api/admin-products/:id - Delete admin product
router.delete('/:id', adminProductController.deleteAdminProduct);

module.exports = router;
