const createError = require('http-errors');
const AdminProduct = require('../models/adminProduct.model');
const { sendSuccess } = require('../utils/response');

// Get all admin products
async function getAdminProducts(req, res, next) {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    const query = { purchasedBy: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sellerName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const adminProducts = await AdminProduct.find(query)
      .populate('category', 'name')
      .populate('seller', 'username email')
      .populate('originalProduct', 'name status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await AdminProduct.countDocuments(query);
    
    return sendSuccess(res, {
      adminProducts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    next(err);
  }
}

// Get single admin product
async function getAdminProduct(req, res, next) {
  try {
    const { id } = req.params;
    
    const adminProduct = await AdminProduct.findOne({
      _id: id,
      purchasedBy: req.user._id
    })
      .populate('category', 'name')
      .populate('seller', 'username email')
      .populate('originalProduct')
      .populate('order');
    
    if (!adminProduct) {
      throw createError(404, 'Admin product not found');
    }
    
    return sendSuccess(res, adminProduct);
  } catch (err) {
    next(err);
  }
}

// Update admin product (fully editable)
async function updateAdminProduct(req, res, next) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    
    const adminProduct = await AdminProduct.findOne({
      _id: id,
      purchasedBy: req.user._id
    });
    
    if (!adminProduct) {
      throw createError(404, 'Admin product not found');
    }
    
    const updateData = {};
    
    // Allow updating all fields
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.sellingPrice !== undefined) {
      updateData.sellingPrice = Number(updates.sellingPrice);
      if (isNaN(updateData.sellingPrice) || updateData.sellingPrice <= 0) {
        throw createError(400, 'Invalid selling price');
      }
    }
    if (updates.status !== undefined) updateData.status = updates.status;
    
    // Handle image update (from file upload)
    if (req.file) {
      updateData.image = req.file.path; // Cloudinary URL
    }
    
    // Handle images array update (for multiple images)
    if (updates.images !== undefined && Array.isArray(updates.images)) {
      updateData.images = updates.images;
    }
    
    const updatedProduct = await AdminProduct.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('category', 'name')
      .populate('seller', 'username email');
    
    return sendSuccess(res, updatedProduct);
  } catch (err) {
    next(err);
  }
}

// Get admin product stats
async function getAdminProductStats(req, res, next) {
  try {
    const userId = req.user._id;
    
    const stats = await AdminProduct.aggregate([
      { $match: { purchasedBy: userId } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalInvestment: { $sum: { $multiply: ['$purchasePrice', '$quantity'] } },
          totalPotentialRevenue: { $sum: { $multiply: ['$sellingPrice', '$quantity'] } },
          activeProducts: {
            $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] }
          },
          soldQuantity: { $sum: '$soldQuantity' },
        }
      }
    ]);
    
    const result = stats[0] || {
      totalProducts: 0,
      totalQuantity: 0,
      totalInvestment: 0,
      totalPotentialRevenue: 0,
      activeProducts: 0,
      soldQuantity: 0
    };
    
    // Calculate potential profit
    result.potentialProfit = result.totalPotentialRevenue - result.totalInvestment;
    result.availableQuantity = result.totalQuantity - result.soldQuantity;
    
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

// Delete admin product (soft delete by setting status to INACTIVE)
async function deleteAdminProduct(req, res, next) {
  try {
    const { id } = req.params;
    
    const adminProduct = await AdminProduct.findOne({
      _id: id,
      purchasedBy: req.user._id
    });
    
    if (!adminProduct) {
      throw createError(404, 'Admin product not found');
    }
    
    if (adminProduct.soldQuantity > 0) {
      throw createError(400, 'Cannot delete product with sales history');
    }
    
    await AdminProduct.findByIdAndUpdate(id, { status: 'INACTIVE' });
    
    return sendSuccess(res, { message: 'Admin product deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// Get products by category for admin
async function getAdminProductsByCategory(req, res, next) {
  try {
    const { categoryId } = req.params;
    
    const adminProducts = await AdminProduct.find({
      purchasedBy: req.user._id,
      category: categoryId,
      status: 'ACTIVE'
    })
      .populate('category', 'name')
      .populate('seller', 'username')
      .sort({ createdAt: -1 });
    
    return sendSuccess(res, adminProducts);
  } catch (err) {
    next(err);
  }
}

// Upload image for admin product
async function uploadAdminProductImage(req, res, next) {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      throw createError(400, 'No image file uploaded');
    }
    
    const adminProduct = await AdminProduct.findOne({
      _id: id,
      purchasedBy: req.user._id
    });
    
    if (!adminProduct) {
      throw createError(404, 'Admin product not found');
    }
    
    // Add image to images array
    if (!adminProduct.images) {
      adminProduct.images = [];
    }
    adminProduct.images.push(req.file.path);
    
    // If no primary image, set this as primary
    if (!adminProduct.image) {
      adminProduct.image = req.file.path;
    }
    
    await adminProduct.save();
    
    return sendSuccess(res, adminProduct);
  } catch (err) {
    next(err);
  }
}

// Delete image from admin product
async function deleteAdminProductImage(req, res, next) {
  try {
    const { id, imageIndex } = req.params;
    const index = parseInt(imageIndex);
    
    if (isNaN(index) || index < 0) {
      throw createError(400, 'Invalid image index');
    }
    
    const adminProduct = await AdminProduct.findOne({
      _id: id,
      purchasedBy: req.user._id
    });
    
    if (!adminProduct) {
      throw createError(404, 'Admin product not found');
    }
    
    if (!adminProduct.images || !Array.isArray(adminProduct.images) || index >= adminProduct.images.length) {
      throw createError(400, 'Image index out of range');
    }
    
    // Remove image from array
    const removedImage = adminProduct.images[index];
    adminProduct.images.splice(index, 1);
    
    // If removed image was the primary image, set first remaining image as primary
    if (adminProduct.image === removedImage && adminProduct.images.length > 0) {
      adminProduct.image = adminProduct.images[0];
    } else if (adminProduct.images.length === 0) {
      adminProduct.image = null;
    }
    
    await adminProduct.save();
    
    return sendSuccess(res, adminProduct);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdminProducts,
  getAdminProduct,
  updateAdminProduct,
  getAdminProductStats,
  deleteAdminProduct,
  getAdminProductsByCategory,
  uploadAdminProductImage,
  deleteAdminProductImage,
};
