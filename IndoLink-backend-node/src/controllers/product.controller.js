const createError = require('http-errors');
const Product = require('../models/product.model');
const Category = require('../models/category.model');
const { sendSuccess } = require('../utils/response');
const Order = require('../models/order.model');
const AdminProduct = require('../models/adminProduct.model');

async function listCategories(req, res, next) {
  try {
    const categories = await Category.find().sort({ created_at: -1 });
    return sendSuccess(res, categories);
  } catch (err) { next(err); }
}

async function createCategory(req, res, next) {
  try {
    const { name, description } = req.body;
    const exists = await Category.findOne({ name });
    if (exists) throw createError(409, 'Category already exists');
    const category = await Category.create({ name, description });
    return sendSuccess(res, category, 201);
  } catch (err) { next(err); }
}

async function listProducts(req, res, next) {
  try {
    const products = await Product.find().populate('category').sort({ created_at: -1 });
    return sendSuccess(res, products);
  } catch (err) { next(err); }
}

async function createProduct(req, res, next) {
  try {
    const payload = { ...req.body };
    // Normalize category and numeric fields
    if (payload.category && typeof payload.category === 'string') {
      payload.category = payload.category;
    }
    if (payload.price !== undefined) payload.price = Number(payload.price);
    if (payload.quantity !== undefined) payload.quantity = Number(payload.quantity);
    if (Number.isNaN(payload.price) || payload.price <= 0) {
      throw createError(400, 'Invalid price');
    }
    if (!Number.isInteger(payload.quantity) || payload.quantity <= 0) {
      throw createError(400, 'Invalid quantity');
    }
    // Attach primary image if uploaded
    if (req.file) {
      // With Cloudinary storage, req.file.path is the secure URL
      payload.image = req.file.path || payload.image;
    }
    if (!payload.seller && req.user) {
      payload.seller = req.user._id;
    }
    if (!payload.seller) throw createError(400, 'seller is required');
    const product = await Product.create(payload);
    return sendSuccess(res, product, 201);
  } catch (err) { next(err); }
}

async function getProductById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) throw createError(404, 'Product not found');
    return sendSuccess(res, product);
  } catch (err) { next(err); }
}

async function getSellerProducts(req, res, next) {
  try {
    const { seller } = req.query;
    let query = {};
    if (req.user && req.user.role === 'SELLER') {
      // Sellers can see all their products including SOLD ones
      query = { seller: req.user._id };
    } else if (seller) {
      query = { seller };
    } else if (req.user && req.user.role === 'ADMIN') {
      // Admin views products listed by sellers that are not yet re-listed by admin
      // Only show ACTIVE and DRAFT products (not SOLD or INACTIVE)
      query = { admin: { $exists: false }, status: { $in: ['DRAFT', 'ACTIVE'] } };
    }
    const products = await Product.find(query)
      .populate('category')
      .populate('seller')
      .sort({ created_at: -1 })
      .lean();
    const mapped = products.map((p) => ({
      id: p._id,
      name: p.name,
      description: p.description,
      category_name: p.category?.name,
      price: p.price,
      quantity: p.quantity,
      quantity_unit: p.quantity_unit || 'kg',
      status: p.status,
      seller_name: p.seller?.username,
      image: p.image,
      primary_image: Array.isArray(p.images) ? (p.images.find((img) => img.isPrimary)?.imageUrl || p.images[0]?.imageUrl) : undefined,
    }));
    return sendSuccess(res, mapped);
  } catch (err) { next(err); }
}

async function getBuyerProducts(req, res, next) {
  try {
    // Buyers should only see admin products that are ACTIVE and have available quantity
    const adminProducts = await AdminProduct.find({ 
      status: 'ACTIVE',
      $expr: { $gt: [{ $subtract: ['$quantity', '$soldQuantity'] }, 0] } // availableQuantity > 0
    })
      .populate('category', 'name')
      .populate('seller', 'username')
      .populate('purchasedBy', 'username')
      .sort({ createdAt: -1 })
      .lean();
      
    const mapped = adminProducts.map((p) => ({
      id: p._id,
      name: p.name,
      description: p.description,
      category_name: p.category?.name,
      category: p.category?._id?.toString?.() || undefined,
      price: p.sellingPrice, // Use admin's selling price, not purchase price
      original_price: p.purchasePrice, // Keep track of original price for reference
      quantity: p.quantity - p.soldQuantity, // Available quantity
      quantity_unit: p.quantity_unit || 'kg',
      total_quantity: p.quantity,
      sold_quantity: p.soldQuantity,
      status: p.status,
      seller_name: p.sellerName, // Original seller name
      admin_name: p.purchasedBy?.username, // Admin who is selling
      image: p.image,
      images: p.images || [],
      primary_image: (Array.isArray(p.images) && p.images.length > 0) ? p.images[0] : p.image,
      purchase_date: p.purchaseDate,
      is_admin_product: true, // Flag to identify admin products
    }));
    
    return sendSuccess(res, mapped);
  } catch (err) { next(err); }
}

async function getAdminProducts(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      // Return empty to avoid frontend hard-fail; auth middleware should normally block
      return sendSuccess(res, []);
    }
    const adminId = req.user._id;
    if (!adminId) return sendSuccess(res, []);
    const products = await Product.find({ admin: adminId })
      .populate('category')
      .populate('seller')
      .sort({ created_at: -1 })
      .lean();
    const mapped = products.map((p) => ({
      id: p._id,
      name: p.name,
      description: p.description,
      category_name: p.category?.name,
      price: p.price,
      relist_price: p.relist_price,
      quantity: p.quantity,
      quantity_unit: p.quantity_unit || 'kg',
      status: p.status,
      seller_name: p.seller?.username,
      image: p.image,
      primary_image: Array.isArray(p.images) ? (p.images.find((img) => img.isPrimary)?.imageUrl || p.images[0]?.imageUrl) : undefined,
    }));
    return sendSuccess(res, mapped);
  } catch (err) { next(err); }
}

async function adminPurchaseProduct(req, res, next) {
  try {
    const { id } = req.params;
    const updates = { status: 'INACTIVE' };
    if (req.user) updates.admin = req.user._id;
    const product = await Product.findByIdAndUpdate(id, updates, { new: true });
    if (!product) throw createError(404, 'Product not found');
    // Record admin purchase order for seller
    await Order.create({
      type: 'ADMIN_PURCHASE',
      admin: req.user._id,
      seller: product.seller,
      items: [{ product: product._id, quantity: 1, price_at_purchase: product.price }],
      total_amount: product.price,
      status: 'PLACED',
      payment_status: 'PAID',
    });
    return sendSuccess(res, product);
  } catch (err) { next(err); }
}

async function adminRelistProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { relist_price } = req.body;
    const updates = { status: 'ACTIVE' };
    if (relist_price !== undefined) updates.relist_price = Number(relist_price);
    const product = await Product.findByIdAndUpdate(id, updates, { new: true });
    if (!product) throw createError(404, 'Product not found');
    return sendSuccess(res, product);
  } catch (err) { next(err); }
}

async function getSellerStats(req, res, next) {
  try {
    let { seller } = req.query;
    if (!seller && req.user) seller = req.user._id;
    const total_products = await Product.countDocuments({ seller });
    const active_products = await Product.countDocuments({ seller, status: 'ACTIVE' });
    const sold_products = await Product.countDocuments({ seller, status: 'SOLD' });
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const recent_products = await Product.countDocuments({ seller, created_at: { $gte: since } });
    // Placeholder values until orders/ratings implemented
    const total_sales = 0;
    const total_orders = 0;
    const average_rating = 0;
    return sendSuccess(res, {
      total_products,
      active_products,
      sold_products,
      recent_products,
      total_sales,
      total_orders,
      average_rating,
    });
  } catch (err) { next(err); }
}

async function uploadProductImage(req, res, next) {
  try {
    const { id } = req.params;
    if (!req.file) throw createError(400, 'No file uploaded');
    const imageUrl = req.file.path; // Cloudinary URL
    const updated = await Product.findByIdAndUpdate(
      id,
      { $push: { images: { imageUrl } } },
      { new: true }
    );
    if (!updated) throw createError(404, 'Product not found');
    return sendSuccess(res, updated);
  } catch (err) { next(err); }
}

async function deleteProductImage(req, res, next) {
  try {
    const { id, imageId } = req.params;
    const updated = await Product.findByIdAndUpdate(
      id,
      { $pull: { images: { _id: imageId } } },
      { new: true }
    );
    if (!updated) throw createError(404, 'Product not found');
    return sendSuccess(res, updated);
  } catch (err) { next(err); }
}

async function relistProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { quantity, price } = req.body;
    
    // Find the original product
    const originalProduct = await Product.findById(id).populate('category');
    if (!originalProduct) throw createError(404, 'Product not found');
    
    // Check if user owns this product
    if (originalProduct.seller.toString() !== req.user._id.toString()) {
      throw createError(403, 'You can only relist your own products');
    }
    
    // Create a new product based on the original
    const newProductData = {
      name: originalProduct.name,
      description: originalProduct.description,
      category: originalProduct.category._id,
      price: price ? Number(price) : originalProduct.price,
      quantity: quantity ? Number(quantity) : 1,
      image: originalProduct.image,
      status: 'ACTIVE',
      seller: req.user._id,
      images: originalProduct.images || [],
    };
    
    const newProduct = await Product.create(newProductData);
    
    return sendSuccess(res, newProduct, 201);
  } catch (err) { next(err); }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    
    // Find the product first to check ownership
    const product = await Product.findById(id);
    if (!product) throw createError(404, 'Product not found');
    
    // Check if user owns the product (seller) or is admin
    if (req.user.role === 'SELLER' && product.seller.toString() !== req.user._id.toString()) {
      throw createError(403, 'You can only edit your own products');
    }
    
    // Handle image update FIRST, before processing other updates
    // This ensures image handling doesn't interfere with other fields
    if (req.file) {
      // New image file uploaded - always use the uploaded file
      updates.image = req.file.path; // Cloudinary URL from file upload
    } else if (req.body.image && typeof req.body.image === 'string') {
      // Image URL provided as string (e.g., when changing primary image to existing image)
      // Only update if it's a valid URL
      const imageValue = req.body.image.trim();
      if (imageValue.startsWith('http') || imageValue.startsWith('https') || imageValue.startsWith('/')) {
        updates.image = imageValue;
      } else {
        // Invalid image URL, remove it from updates to keep current image
        delete updates.image;
      }
    } else {
      // No image update provided, remove from updates to keep current image
      delete updates.image;
    }
    
    // Normalize numeric fields
    if (updates.price !== undefined) {
      updates.price = Number(updates.price);
      if (isNaN(updates.price) || updates.price <= 0) {
        throw createError(400, 'Invalid price');
      }
    }
    if (updates.quantity !== undefined) {
      updates.quantity = Number(updates.quantity);
      if (isNaN(updates.quantity) || updates.quantity < 0 || !Number.isInteger(updates.quantity)) {
        throw createError(400, 'Invalid quantity');
      }
    }
    
    // Handle category update
    if (updates.category) {
      updates.category = updates.category;
    }
    
    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      id, 
      updates, 
      { new: true, runValidators: true }
    ).populate('category');
    
    if (!updatedProduct) throw createError(404, 'Product not found');
    return sendSuccess(res, updatedProduct);
  } catch (err) { next(err); }
}

async function searchByImage(req, res, next) {
  try {
    if (!req.file) throw createError(400, 'No image uploaded');
    
    // Get Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw createError(500, 'Gemini API key not configured');
    }

    // Read the image file (support Cloudinary URL or local fallback)
    const imageMimeType = req.file.mimetype || 'image/jpeg';
    let imageBase64;
    if (req.file.path && /^https?:\/\//i.test(req.file.path)) {
      const resFetch = await fetch(req.file.path);
      const arrBuf = await resFetch.arrayBuffer();
      imageBase64 = Buffer.from(arrBuf).toString('base64');
    } else if (req.file.buffer) {
      imageBase64 = Buffer.from(req.file.buffer).toString('base64');
    } else {
      const fs = require('fs');
      const path = require('path');
      const imagePath = path.join(__dirname, '../../uploads', req.file.filename);
      const imageBuffer = fs.readFileSync(imagePath);
      imageBase64 = imageBuffer.toString('base64');
    }

    console.log('Calling Gemini Vision API for image analysis...');
    
    // Call Gemini Vision API with structured output
    const prompt = `Analyze this image of a product and provide detailed information about what type of product it is.

Analyze the image thoroughly and provide:
1. The main product category (be specific and accurate)
2. Potential variations or subcategories
3. Key features that help identify the product

Focus on identifying the exact product type for a marketplace setting.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: imageMimeType,
                data: imageBase64
              }
            }
          ]
        }],
        generationConfig: {
          response_mime_type: "application/json",
          response_schema: {
            type: "object",
            properties: {
              primary_category: {
                type: "string",
                description: "Main product category (e.g., 'Mobile Phones', 'Laptops', 'Shoes')"
              },
              secondary_categories: {
                type: "array",
                items: { type: "string" },
                description: "Alternative or related categories"
              },
              product_description: {
                type: "string",
                description: "Brief description of what the product appears to be"
              },
              confidence: {
                type: "number",
                description: "Confidence score from 0-100"
              },
              search_keywords: {
                type: "array",
                items: { type: "string" },
                description: "Keywords to help search for similar products"
              }
            },
            required: ["primary_category", "confidence"]
          }
        }
      })
    });

    console.log('Gemini Vision API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini Vision API error:', errorText);
      throw createError(500, `Gemini Vision API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini Vision response:', JSON.stringify(data, null, 2));

    if (data.error) {
      throw createError(500, `Gemini API error: ${data.error.message}`);
    }

    // Parse structured JSON response
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('Extracted JSON:', text);

    let analysis;
    try {
      analysis = JSON.parse(text);
      console.log('Parsed image analysis:', analysis);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      throw createError(500, 'Failed to parse image analysis');
    }

    const categoryDescription = analysis.primary_category || '';

    // Find matching categories with improved matching
    const categories = await Category.find().lean();
    const categoryDescriptionLower = categoryDescription.toLowerCase();
    const searchKeywords = analysis.search_keywords || [];
    
    const matchedCategories = categories.filter(cat => {
      const catNameLower = cat.name.toLowerCase();
      // Exact match
      if (catNameLower === categoryDescriptionLower) return true;
      // Contains match (in either direction)
      if (categoryDescriptionLower.includes(catNameLower) || catNameLower.includes(categoryDescriptionLower)) return true;
      // Check against search keywords
      if (searchKeywords.some(keyword => catNameLower.includes(keyword.toLowerCase()))) return true;
      return false;
    });

    console.log(`Found ${matchedCategories.length} matching categories for "${categoryDescription}"`);

    // Build search keywords - use primary category, secondary categories, and all search keywords
    const allKeywords = [
      analysis.primary_category,
      ...(analysis.secondary_categories || []),
      ...(analysis.search_keywords || [])
    ].filter(k => k && typeof k === 'string').map(k => k.toLowerCase());

    console.log('Searching for products with keywords:', allKeywords);

    // Search products by keywords in name and description
    const AdminProduct = require('../models/adminProduct.model');
    
    // Create a query that searches in product names and descriptions
    const keywordRegex = new RegExp(allKeywords.join('|'), 'i');
    
    const products = await AdminProduct.find({
      status: 'ACTIVE',
      $or: [
        // Match by categories if any matched
        ...(matchedCategories.length > 0 ? [{ category: { $in: matchedCategories.map(c => c._id) } }] : []),
        // Match by name
        { name: keywordRegex },
        // Match by description
        { description: keywordRegex }
      ],
      $expr: { $gt: [{ $subtract: ['$quantity', '$soldQuantity'] }, 0] }
    })
      .populate('category', 'name')
      .populate('seller', 'username')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    
    console.log(`Found ${products.length} products matching keywords`);

    // Map products to the expected format
    const mappedProducts = products.map((p) => ({
      id: p._id,
      name: p.name,
      description: p.description,
      category_name: p.category?.name,
      category: p.category?._id?.toString?.() || undefined,
      price: p.sellingPrice,
      original_price: p.purchasePrice,
      quantity: p.quantity - p.soldQuantity,
      total_quantity: p.quantity,
      sold_quantity: p.soldQuantity,
      status: p.status,
      seller_name: p.sellerName,
      admin_name: p.purchasedBy?.username,
      image: p.image,
      images: p.images || [],
      primary_image: (Array.isArray(p.images) && p.images.length > 0) ? p.images[0] : p.image,
      is_admin_product: true,
    }));

    // No local cleanup needed when using Cloudinary URL

    return sendSuccess(res, {
      detected_category: categoryDescription,
      secondary_categories: analysis.secondary_categories || [],
      product_description: analysis.product_description || '',
      confidence: analysis.confidence || 0,
      search_keywords: analysis.search_keywords || [],
      matched_categories: matchedCategories.map(c => ({ id: c._id, name: c.name })),
      products: mappedProducts,
      total_results: mappedProducts.length
    });

  } catch (err) { next(err); }
}

module.exports = {
  listCategories,
  createCategory,
  listProducts,
  createProduct,
  getProductById,
  getSellerProducts,
  getBuyerProducts,
  getAdminProducts,
  adminPurchaseProduct,
  adminRelistProduct,
  getSellerStats,
  uploadProductImage,
  deleteProductImage,
  relistProduct,
  updateProduct,
  searchByImage,
};


