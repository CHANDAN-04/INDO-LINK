const { Router } = require('express');
const { protect, requireRoles } = require('../middleware/auth');
const { sendSuccess } = require('../utils/response');
const Product = require('../models/product.model');
const User = require('../models/user.model');
const Order = require('../models/order.model');
const dayjs = require('dayjs');
const dotenv = require('dotenv');
const router = Router();

dotenv.config();

router.get('/dashboard-metrics', protect, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const [total_products, total_users] = await Promise.all([
      Product.countDocuments({}),
      User.countDocuments({}),
    ]);

    // Revenue from paid BUYER_PURCHASE orders
    const revenueAgg = await Order.aggregate([
      { $match: { type: 'BUYER_PURCHASE', payment_status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } },
    ]);
    const total_revenue = revenueAgg[0]?.total || 0;

    // Top categories by count with proper population
    const categoriesAgg = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Get category names by fetching categories
    const Category = require('../models/category.model');
    const categoryIds = categoriesAgg.map(c => c._id).filter(Boolean);
    const categories = await Category.find({ _id: { $in: categoryIds } }).lean();
    const categoryMap = new Map(categories.map(cat => [cat._id.toString(), cat.name]));

    // Build top_categories object with proper names
    const top_categories = {};
    for (const c of categoriesAgg) {
      const categoryName = categoryMap.get(c._id?.toString()) || `Category ${c._id}`;
      top_categories[categoryName] = c.count;
    }

    // Top products by quantity (proxy for sales), using price as revenue proxy
    const top_products_docs = await Product.find({ status: { $in: ['ACTIVE', 'SOLD'] } })
      .sort({ quantity: -1 })
      .limit(5)
      .lean();
    const top_products = top_products_docs.map((p) => ({
      name: p.name,
      total_sold: Math.max(0, p.quantity || 0),
      revenue: Math.max(0, (p.relist_price || p.price || 0) * Math.max(0, p.quantity || 0)),
    }));

    // Top sellers by total product value listed (simple proxy)
    const top_sellers_agg = await Product.aggregate([
      { $group: { _id: '$seller', total_sales: { $sum: { $multiply: [{ $ifNull: ['$quantity', 0] }, { $ifNull: ['$price', 0] }] } } } },
      { $sort: { total_sales: -1 } },
      { $limit: 5 },
    ]);
    const sellerIds = top_sellers_agg.map((s) => s._id).filter(Boolean);
    const sellers = await User.find({ _id: { $in: sellerIds } }).lean();
    const sellerMap = new Map(sellers.map((u) => [u._id.toString(), u]));
    const top_sellers = top_sellers_agg.map((s) => ({
      username: sellerMap.get(s._id?.toString())?.username || String(s._id),
      total_sales: Math.max(0, s.total_sales || 0),
    }));

    // Total orders (paid buyer purchases)
    const total_orders = await Order.countDocuments({ type: 'BUYER_PURCHASE', payment_status: 'PAID' });

    return sendSuccess(res, {
      total_revenue,
      total_orders,
      total_users,
      total_products,
      top_categories,
      top_products,
      top_sellers,
    });
  } catch (err) { next(err); }
});

router.get('/sales-analytics', protect, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 30;
    const since = dayjs().subtract(days - 1, 'day').startOf('day').toDate();
    // Aggregate paid buyer orders per day
    const agg = await Order.aggregate([
      { $match: { type: 'BUYER_PURCHASE', payment_status: 'PAID', created_at: { $gte: since } } },
      { $project: { day: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } }, total_sales: '$total_amount' } },
      { $group: { _id: '$day', total_sales: { $sum: '$total_sales' } } },
      { $sort: { _id: 1 } },
    ]);
    // Build full series including days with zero
    const series = [];
    for (let i = 0; i < days; i++) {
      const d = dayjs().subtract(days - 1 - i, 'day').format('YYYY-MM-DD');
      const found = agg.find((a) => a._id === d);
      series.push({ date: d, total_sales: found?.total_sales || 0 });
    }
    return sendSuccess(res, series);
  } catch (err) { next(err); }
});

router.get('/market-trends', protect, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    // Simple trend: category share over last 30 days
    const since = dayjs().subtract(30, 'day').toDate();
    const agg = await Product.aggregate([
      { $match: { created_at: { $gte: since } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);
    
    // Get category names by fetching categories
    const Category = require('../models/category.model');
    const categoryIds = agg.map(a => a._id).filter(Boolean);
    const categories = await Category.find({ _id: { $in: categoryIds } }).lean();
    const categoryMap = new Map(categories.map(cat => [cat._id.toString(), cat.name]));
    
    const trends = agg.map(a => ({
      category: categoryMap.get(a._id?.toString()) || `Category ${a._id}`,
      count: a.count
    }));
    
    return sendSuccess(res, trends);
  } catch (err) { next(err); }
});

router.get('/analyze-product/:id', protect, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return sendSuccess(res, null);
    const result = {
      market_trend: product.market_trend || 'Stable',
      recommended_price: product.recommended_price || product.relist_price || product.price,
      confidence_score: product.gemini_analysis?.confidence_score || 70,
      insights: product.gemini_analysis?.insights || 'Price appears competitive relative to similar listings.',
      recommendations: product.gemini_analysis?.recommendations || 'Slightly increase price if demand rises next week.',
    };
    return sendSuccess(res, result);
  } catch (err) { next(err); }
});

router.post('/analyze-product/:id', protect, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);
    if (!product) return sendSuccess(res, null);

    // Get Gemini API key - REQUIRED
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('GEMINI_API_KEY found:', !!apiKey);
    
    if (!apiKey) {
      throw createError(500, 'Gemini API key not configured');
    }

    console.log('Calling Gemini API for product:', product.name);
    
    try {
      // Improved prompt for better structured response
      const prompt = `You are a marketplace pricing assistant analyzing products for a B2B marketplace. 

Product Details:
- Name: ${product.name}
- Description: ${product.description}
- Current Price: ₹${product.relist_price || product.price}

Provide your analysis in EXACTLY this format (one field per line):
Market Trend: Up/Down/Stable
Recommended Price: <number only, no currency symbol>
Confidence Score: <number between 0-100>
Insights: <one clear sentence about market demand>
Recommendations: <one actionable sentence about pricing>

Only provide the analysis in the format above, no additional text.`;

      // Use native fetch (available in Node 18+)
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            response_mime_type: "application/json",
            response_schema: {
              type: "object",
              properties: {
                market_trend: {
                  type: "string",
                  enum: ["Up", "Down", "Stable"],
                  description: "Market trend direction"
                },
                recommended_price: {
                  type: "number",
                  description: "Recommended selling price in INR"
                },
                confidence_score: {
                  type: "number",
                  description: "Confidence score between 0-100"
                },
                insights: {
                  type: "string",
                  description: "Key insights about market demand and positioning"
                },
                recommendations: {
                  type: "string",
                  description: "Actionable pricing strategy recommendations"
                }
              },
              required: ["market_trend", "recommended_price", "confidence_score", "insights", "recommendations"]
            }
          }
        }),
      });

      console.log('Gemini response status:', resp.status);

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('Gemini API error:', errorText);
        throw new Error(`Gemini API error: ${resp.status}`);
      }

      const data = await resp.json();
      console.log('Gemini API response:', JSON.stringify(data, null, 2));

      if (data.error) {
        throw new Error(data.error.message || 'Gemini API error');
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('Extracted JSON response:', text);

      // Parse structured JSON response
      let analysis;
      try {
        analysis = JSON.parse(text);
        console.log('Parsed structured analysis:', analysis);
        
        // Validate required fields
        if (!analysis.market_trend || !analysis.recommended_price || !analysis.confidence_score) {
          throw new Error('Invalid analysis structure from Gemini');
        }
        
        // Ensure data types are correct
        analysis = {
          market_trend: analysis.market_trend,
          recommended_price: Number(analysis.recommended_price),
          confidence_score: Math.min(100, Math.max(0, Number(analysis.confidence_score))),
          insights: analysis.insights || 'Market data analyzed successfully.',
          recommendations: analysis.recommendations || 'Monitor sales performance and adjust pricing accordingly.',
        };
      } catch (parseError) {
        console.error('Error parsing Gemini JSON response:', parseError);
        throw new Error('Failed to parse Gemini structured response');
      }

      console.log('Saving analysis to database...');
      product.market_trend = analysis.market_trend;
      product.recommended_price = analysis.recommended_price;
      product.gemini_analysis = {
        confidence_score: analysis.confidence_score,
        insights: analysis.insights,
        recommendations: analysis.recommendations,
        updated_at: new Date().toISOString(),
      };
      
      const savedProduct = await product.save();
      console.log('Analysis saved successfully. Product ID:', savedProduct._id);
      console.log('Saved data:', {
        market_trend: savedProduct.market_trend,
        recommended_price: savedProduct.recommended_price,
        gemini_analysis: savedProduct.gemini_analysis
      });

      return sendSuccess(res, analysis);
      
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw createError(500, `Failed to analyze product: ${error.message}`);
    }
  } catch (err) { next(err); }
});

module.exports = router;


