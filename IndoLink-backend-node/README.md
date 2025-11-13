IndoLink Node.js Backend

Setup

1. Install dependencies
   npm install

2. Configure environment
   Copy .env.example to .env and set MONGO_URI and PORT
   
   Add Cloudinary variables (copy-paste):
   
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   # Optional single URL style
   # CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME

3. Run in dev
   npx nodemon

4. Health check
   GET http://localhost:4000/health

Seeding Data

1. Seed admin user:
   node src/scripts/seed-admin.js

2. Seed categories:
   node src/scripts/seed-categories.js

3. Seed buyers, producers (sellers), and brokers:
   node src/scripts/seed-users.js
   
   This creates:
   - 5 producers (sellers) with Indian names and addresses
   - 10 buyers with Indian names and addresses
   - 10 brokers with Indian names and addresses (includes broker profiles with unique codes)
   - Default password for all seeded users: Password@123

Storage Migration to Cloudinary

1. Install new packages:
   npm install cloudinary multer-storage-cloudinary

2. Run migration (uploads local images to Cloudinary and updates MongoDB):
   node scripts/migrate-local-to-cloudinary.js

3. Start the app (same as before):
   npm start

Manual verification

- Upload a new product image from the app and confirm:
  - Image appears in your Cloudinary Media Library
  - Product document stores the Cloudinary secure URL in `image` or `images.imageUrl`
- Visit product/slider pages to ensure images render using Cloudinary URLs.
- No API endpoints or field names were changed.


