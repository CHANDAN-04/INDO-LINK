# IndoLink - Complete Documentation

## Overview

IndoLink is a comprehensive multi-role e-commerce marketplace platform that connects **Sellers**, **Buyers**, **Brokers**, and **Admins** in a structured marketplace ecosystem. The platform supports product management, order processing, payment integration via Razorpay, AI-powered image search, analytics, and commission-based broker system.

## Architecture

- **Backend**: Node.js + Express.js + MongoDB
- **Frontend**: React + Vite + Tailwind CSS
- **Payment Gateway**: Razorpay
- **AI Integration**: Google Gemini API (for image search and analytics)
- **Authentication**: JWT-based authentication

---

## User Roles

### 1. **BUYER** 👤
**Purpose**: Purchase products from the marketplace

**Features**:
- Browse product catalog with category filtering
- Image-based product search using AI (Google Gemini)
- Add products to cart
- Place orders
- View order history
- Make payments via Razorpay (uses admin's Razorpay credentials)
- Search products by text or image upload/camera capture

**Dashboard Sections**:
- **Products**: Browse and search products across all categories
- **Cart**: Manage cart items before checkout
- **Orders**: View order history and track order status

**Key Features**:
- **Image Search**: Upload an image or capture via camera to find similar products using AI
- **Category Filtering**: Filter products by predefined categories
- **Hero Slider**: View promotional banners on the homepage

---

### 2. **SELLER** 🏪
**Purpose**: List and manage products, sell to admin

**Features**:
- Create and manage product listings
- Add product details (name, description, price, quantity, images, category)
- View product statistics (total products, sold products, active products)
- Manage orders received from admin
- Configure Razorpay payment credentials (for receiving payments from admin)
- Track sales performance

**Dashboard Sections**:
- **My Products**: View and manage all listed products
- **Add Product**: Create new product listings
- **Orders**: View orders placed by admin
- **Payment Setup**: Configure Razorpay credentials

**Workflow**:
1. Register as Seller
2. Configure Razorpay credentials (optional but required for receiving payments)
3. Add products with details
4. Admin reviews and purchases products
5. Receive payments from admin via Razorpay

---

### 3. **ADMIN** 👑
**Purpose**: Manage marketplace, purchase from sellers, sell to buyers

**Features**:
- **Seller Product Management**: Review and purchase products from sellers
- **Admin Product Management**: Manage products sold to buyers (with markup pricing)
- **Order Management**: Manage all buyer orders
- **Analytics Dashboard**: View platform statistics and trends
- **AI Analysis**: Get insights using Google Gemini AI
- **Slider Management**: Manage homepage hero slider banners
- **Payment Configuration**: Configure Razorpay credentials (used for buyer payments)
- **Statistics**: View total products, active sellers, platform revenue, total orders

**Dashboard Sections**:
- **Seller Products**: Browse and purchase products from sellers
- **My Products**: Manage products available for buyers (with markup)
- **Orders**: Manage all buyer orders
- **Analytics**: View platform statistics and charts
- **AI Analysis**: Get AI-powered insights and recommendations
- **Slider**: Manage homepage promotional banners

**Key Workflow**:
1. Browse seller products
2. Purchase products from sellers (uses seller's Razorpay)
3. Set selling price with markup
4. Products become available to buyers
5. Process buyer orders
6. Receive payments from buyers (uses admin's Razorpay)

---

### 4. **BROKER** 🤝
**Purpose**: Facilitate connections between buyers/sellers and earn commissions

**Features**:
- **Unique Broker Code**: Each broker gets a unique code
- **User Management**: View all buyers and sellers who registered using their broker code
- **Commission Tracking**: Earn 5% commission on profits from transactions
- **Earnings Dashboard**: View total earnings and recent commissions
- **Status Management**: Track commission payment status (PENDING/PAID)

**How It Works**:
1. Broker registers and receives a unique broker code
2. Buyers/Sellers register using the broker code
3. When transactions occur between broker's users, broker earns 5% commission
4. Commission is calculated from profit margin
5. Admin manages commission payments

**Dashboard Features**:
- Display broker code (with copy functionality)
- Total users count (buyers + sellers)
- Total earnings
- Recent earnings list
- User list (buyers and sellers associated with broker code)

---

## Complete Workflow

### Registration Flow
1. User visits landing page
2. Selects role (Buyer, Seller, Broker)
3. Registers with email, username, password
4. For Broker: Enters broker code (optional) if referred by another broker
5. Redirected to respective dashboard after login

### Product Listing Flow (Seller → Admin)
1. **Seller** creates product listing with details
2. Product appears in **Admin** dashboard under "Seller Products"
3. **Admin** reviews product and sets selling price
4. **Admin** purchases product from seller (payment via seller's Razorpay)
5. Product quantity is deducted from seller's inventory
6. Product becomes available in **Admin** dashboard under "My Products"
7. Product is now visible to **Buyers**

### Purchase Flow (Buyer → Admin)
1. **Buyer** browses products or searches by image
2. **Buyer** adds products to cart
3. **Buyer** places order
4. Payment is processed via **Admin's** Razorpay credentials
5. Order status updates to "CONFIRMED"
6. **Admin** views order in order management
7. **Buyer** can track order in order history

### Broker Commission Flow
1. Broker's users (buyers/sellers) make transactions
2. System calculates profit margin
3. 5% commission is calculated from profit
4. Commission is credited to broker's account
5. Admin manages commission payments
6. Broker views earnings in dashboard

---

## Key Features

### 1. **AI-Powered Image Search** 🔍
- Uses Google Gemini API to analyze uploaded images
- Detects product category from image
- Matches similar products in catalog
- Supports:
  - Image file upload
  - Camera capture (mobile-friendly)
  - Real-time preview

### 2. **Razorpay Payment Integration** 💳
- **Buyer Payments**: Uses admin's Razorpay credentials
- **Admin → Seller Payments**: Uses seller's Razorpay credentials
- Secure payment verification
- Order tracking with payment status

### 3. **Product Management** 📦
- Multi-category product organization
- Image upload support
- Inventory management (quantity tracking)
- Product activation/deactivation
- Price markup system (admin)

### 4. **Order Management** 📋
- Order status tracking:
  - `PLACED`: Order created
  - `CONFIRMED`: Payment received
  - `SHIPPED`: Order shipped
  - `DELIVERED`: Order delivered
  - `CANCELLED`: Order cancelled
- Payment status tracking:
  - `CREATED`: Payment order created
  - `PAID`: Payment completed
  - `FAILED`: Payment failed

### 5. **Analytics Dashboard** 📊
- Platform statistics:
  - Total products
  - Active sellers
  - Platform revenue
  - Total orders
- Seller-specific analytics
- Order trends
- Revenue charts

### 6. **AI Analysis** 🤖
- Google Gemini integration for:
  - Product recommendations
  - Market insights
  - Trend analysis
  - Business intelligence

### 7. **Slider Management** 🎠
- Admin can manage homepage hero slider
- Add promotional banners
- Link banners to products or pages
- Multiple slides support

---

## API Endpoints Overview

### Authentication (`/api/auth/`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /token/refresh` - Refresh access token
- `GET /me` - Get current user profile
- `PUT /profile` - Update user profile
- `PUT /razorpay` - Update Razorpay credentials

### Products (`/api/products/`)
- `GET /categories/` - Get all categories
- `GET /` - Get products (with filters)
- `GET /:id` - Get product details
- `POST /` - Create product (Seller only)
- `PUT /:id` - Update product (Seller only)
- `DELETE /:id` - Delete product (Seller only)
- `GET /seller/stats/` - Get seller statistics
- `POST /search-by-image` - AI image search

### Orders (`/api/orders/`)
- `POST /` - Create order (Buyer only)
- `GET /buyer/` - Get buyer orders
- `GET /seller/` - Get seller orders
- `GET /admin/` - Get all orders (Admin only)
- `PUT /:id/status` - Update order status

### Payments (`/api/payments/`)
- `POST /razorpay/create-order` - Create Razorpay order
- `POST /razorpay/verify` - Verify payment signature
- `POST /admin/purchase` - Admin purchase from seller
- `POST /admin/purchase/verify` - Verify admin purchase payment

### Admin (`/api/admin/`)
- `GET /stats/` - Get platform statistics
- `GET /products/` - Get seller products
- `POST /products/:id/purchase` - Purchase from seller
- `GET /my-products/` - Get admin products
- `POST /products/` - Create admin product
- `PUT /products/:id` - Update admin product
- `DELETE /products/:id` - Delete admin product

### Broker (`/api/broker/`)
- `GET /dashboard` - Get broker dashboard data
- `GET /users` - Get broker's users
- `GET /earnings` - Get broker earnings

### Analytics (`/api/analytics/`)
- `GET /overview` - Get platform analytics
- `GET /seller` - Get seller analytics
- `GET /revenue` - Get revenue analytics

### Slider (`/api/slider/`)
- `GET /` - Get all slider items
- `POST /` - Create slider item (Admin only)
- `PUT /:id` - Update slider item (Admin only)
- `DELETE /:id` - Delete slider item (Admin only)

---

## Payment Flow Details

### Buyer Payment Flow
1. Buyer adds products to cart
2. Buyer places order → Order created with status `PLACED`
3. System creates Razorpay order using admin's credentials
4. Buyer redirected to Razorpay checkout
5. Buyer completes payment
6. Payment verification → Order status updated to `CONFIRMED` and `PAID`

### Admin → Seller Payment Flow
1. Admin selects product from seller
2. Admin sets selling price (with markup)
3. System creates Razorpay order using seller's credentials
4. Admin completes payment via Razorpay
5. Payment verification → Product quantity deducted
6. Product moved to admin's inventory

---

## Environment Variables

### Backend (`.env`)
```env
PORT=4000
JWT_SECRET=your_jwt_secret_here
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend (`.env`)
```env
VITE_API_BASE_URL=http://localhost:4000
```

---

## Database Models

### User Model
- `username`, `email`, `password_hash`
- `role` (ADMIN, SELLER, BUYER, BROKER)
- `razorpay_key_id`, `razorpay_key_secret` (for sellers/admin)
- `broker_id`, `broker_code` (for brokers)

### Product Model
- `name`, `description`, `price`, `quantity`
- `category`, `images[]`
- `seller` (reference to User)
- `is_active`, `created_at`

### Order Model
- `type` (BUYER_PURCHASE, ADMIN_PURCHASE)
- `buyer`, `seller`, `admin` (references)
- `items[]` (product, quantity, price_at_purchase)
- `total_amount`, `status`, `payment_status`
- `razorpay_order_id`, `razorpay_payment_id`

### Category Model
- `name`, `description`
- `created_at`

### Slider Model
- `title`, `imageUrl`, `linkUrl`
- `is_active`, `order`

---

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected routes with role-based access control
- CORS configuration
- Helmet.js for security headers
- Request validation with Joi
- Razorpay signature verification

---

## Getting Started

See the main [README.md](./README.md) for setup instructions.

---

## Technology Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: React, Vite, React Router, Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: React Query (TanStack Query)
- **Payment**: Razorpay
- **AI**: Google Gemini API
- **Authentication**: JWT
- **File Upload**: Multer

---

## Notes

- Razorpay credentials are required for sellers who want to receive payments
- Admin Razorpay credentials are used for buyer payments
- Broker commissions are calculated automatically on transactions
- Image search requires Google Gemini API key
- All prices are in INR (Indian Rupees)
- Product images are stored in `uploads/` directory

---

## Support

For issues or questions, please refer to the project documentation or contact the development team.

