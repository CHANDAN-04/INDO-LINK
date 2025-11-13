# IndoLink Project

This is a full-stack application with a Node.js backend and React frontend.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Setup Instructions

### 1. Backend Setup

Navigate to the backend directory:
```bash
cd IndoLink-backend-node
```

Install dependencies:
```bash
npm install
```

Configure environment variables:
- Copy `.env.example` to `.env`
- Update the following variables in `.env`:
  ```
  PORT=4000
  JWT_SECRET=your_jwt_secret_here
  MONGO_URI=your_mongodb_connection_string
  GEMINI_API_KEY=your_gemini_api_key
  ```

### 2. First Time Setup (New Database)

If you're setting up the project for the first time with a new database, you need to seed the database with initial data:

After configuring your `.env` file, run the seed scripts:
```bash
npm run seed:admin
npm run seed:categories
```

These scripts will:
- `seed:admin`: Create an admin user in the database
- `seed:categories`: Add default categories to the database

### 3. Start Backend Server

Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:4000` (or the port specified in your `.env` file).

### 4. Frontend Setup

Open a new terminal and navigate to the frontend directory:
```bash
cd IndoLink-frontend
```

Install dependencies:
```bash
npm install
```

Start the frontend development server:
```bash
npm run dev
```

The frontend will typically run on `http://localhost:5173` (Vite default port).

## Project Structure

```
IndoLink/
├── IndoLink-backend-node/    # Node.js backend
│   ├── src/
│   │   ├── server.js         # Server entry point
│   │   ├── scripts/          # Database seed scripts
│   │   └── ...
│   └── package.json
└── IndoLink-frontend/        # React frontend
    ├── src/
    └── package.json
```

## Quick Start Summary

1. **Backend**: `cd IndoLink-backend-node` → `npm install` → Update `.env` → `npm run seed:admin` → `npm run seed:categories` → `npm run dev`
2. **Frontend**: `cd IndoLink-frontend` → `npm install` → `npm run dev`

## Notes

- Make sure MongoDB is running before starting the backend
- The seed scripts should only be run once when setting up a new database
- Keep your `.env` file secure and never commit it to version control

## Documentation

For complete documentation on how the website works, features, user roles, workflows, and API endpoints, see [DOCUMENTATION.md](./DOCUMENTATION.md).

