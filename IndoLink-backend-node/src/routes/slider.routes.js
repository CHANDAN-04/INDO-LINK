const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { configureCloudinaryFromEnv } = require('../config/cloudinary');
const { sendSuccess } = require('../utils/response');
const { protect, requireRoles } = require('../middleware/auth');
const SliderItem = require('../models/slider.model');
const createError = require('http-errors');

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
      folder: 'indolink/slider',
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

// Public slider items (active only)
router.get('/', async (req, res, next) => {
  try {
    const items = await SliderItem.find({ active: true })
      .populate('product', 'name image _id')
      .sort({ order: 1, created_at: -1 });
    return sendSuccess(res, items);
  } catch (err) { next(err); }
});

// Admin routes for slider management
router.get('/admin', protect, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const items = await SliderItem.find()
      .populate('product', 'name image _id')
      .sort({ order: 1, created_at: -1 });
    return sendSuccess(res, items);
  } catch (err) { next(err); }
});

router.post('/admin', protect, requireRoles('ADMIN'), upload.single('image'), async (req, res, next) => {
  try {
    const { title, subtitle, imageUrl, linkUrl, product, order, active } = req.body;
    
    // Use uploaded image if provided, otherwise use imageUrl
    const finalImageUrl = req.file ? req.file.path : imageUrl;
    
    if (!title || !finalImageUrl) {
      throw createError(400, 'Title and image are required');
    }
    
    const item = await SliderItem.create({
      title,
      subtitle,
      imageUrl: finalImageUrl,
      linkUrl: linkUrl || (product ? `/buyer/product/${product}` : undefined),
      product: product || undefined,
      order: parseInt(order) || 0,
      active: active !== false,
    });
    
    return sendSuccess(res, item, 201);
  } catch (err) { next(err); }
});

router.put('/admin/:id', protect, requireRoles('ADMIN'), upload.single('image'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, subtitle, imageUrl, linkUrl, product, order, active } = req.body;
    
    const updateData = {
      title,
      subtitle,
      linkUrl: linkUrl || (product ? `/buyer/product/${product}` : undefined),
      product: product || undefined,
      order: parseInt(order) || 0,
      active: active !== false,
    };
    
    // Update image if a new one is uploaded
    if (req.file) {
      updateData.imageUrl = req.file.path;
    } else if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }
    
    const item = await SliderItem.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('product', 'name image');
    
    if (!item) {
      throw createError(404, 'Slider item not found');
    }
    
    return sendSuccess(res, item);
  } catch (err) { next(err); }
});

router.delete('/admin/:id', protect, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const item = await SliderItem.findByIdAndDelete(id);
    
    if (!item) {
      throw createError(404, 'Slider item not found');
    }
    
    return sendSuccess(res, { message: 'Slider item deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;


