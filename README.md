# 📦 ProductCatalog

A full-stack product catalog web application with JWT authentication and Cloudinary image uploads.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Axios, React Router v6 |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB |
| Auth | JWT + bcryptjs |
| Images | Cloudinary (direct browser upload) |
| DevOps | Docker + Docker Compose |

---

## Features

- ✅ Signup & Login with JWT authentication
- ✅ Browse all products (public)
- ✅ Create products with drag-and-drop image upload (protected)
- ✅ Images uploaded directly to Cloudinary from the browser
- ✅ Responsive dark-mode UI with glassmorphism design
- ✅ Fully Dockerized — single command to run everything

---

## Project Structure

```
product-catalog/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express entry point
│   │   ├── models/
│   │   │   ├── User.js       # Mongoose User model
│   │   │   └── Product.js    # Mongoose Product model
│   │   ├── routes/
│   │   │   ├── auth.js       # POST /signup, POST /login
│   │   │   └── products.js   # GET /products, POST /products
│   │   └── middleware/
│   │       └── auth.js       # JWT protect middleware
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   │   ├── api.js        # Axios instance
│   │   │   └── cloudinary.js # Cloudinary upload helper
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── SignupPage.jsx
│   │       ├── ProductsPage.jsx
│   │       └── CreateProductPage.jsx
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- A [Cloudinary](https://cloudinary.com) account (free tier works)

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd product-catalog
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
JWT_SECRET=your_super_secret_key
CLIENT_URL=http://localhost:3000

VITE_API_URL=http://localhost:5000
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

#### Setting up Cloudinary

1. Log in to [cloudinary.com](https://cloudinary.com)
2. Go to **Settings → Upload → Upload presets**
3. Click **Add upload preset**
4. Set **Signing mode** to **Unsigned**
5. Copy the preset name into `VITE_CLOUDINARY_UPLOAD_PRESET`
6. Copy your Cloud Name from the Dashboard into `VITE_CLOUDINARY_CLOUD_NAME`

### 3. Run with Docker

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| MongoDB | mongodb://localhost:27017 |

---

## Local Development (without Docker)

### Backend

```bash
cd backend
cp .env.example .env   # edit with your values
npm install
npm run dev            # runs on :5000 with nodemon
```

### Frontend

```bash
cd frontend
cp .env.example .env   # edit with your values
npm install
npm run dev            # runs on :3000
```

> Make sure MongoDB is running locally or set `MONGO_URI` to a MongoDB Atlas URI.

---

## API Reference

### Auth

| Method | Route | Body | Auth |
|--------|-------|------|------|
| POST | `/api/auth/signup` | `{ name, email, password }` | None |
| POST | `/api/auth/login` | `{ email, password }` | None |

Both return: `{ token, user: { id, name, email } }`

### Products

| Method | Route | Body | Auth |
|--------|-------|------|------|
| GET | `/api/products` | — | None |
| POST | `/api/products` | `{ title, description, price, imageUrl }` | Bearer JWT |

---

## Image Upload Flow

```
Browser  →  Cloudinary (direct upload, no backend involved)
         ↓
     imageUrl (Cloudinary secure URL)
         ↓
Browser  →  Backend API  →  MongoDB (stores imageUrl)
```

The backend **never** handles file bytes — it only stores the Cloudinary URL.

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Express server port (default: 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `CLIENT_URL` | Frontend URL for CORS |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |
| `VITE_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Unsigned upload preset name |

---

## Production Deployment

- Set `VITE_API_URL` to your deployed backend URL
- Set `CLIENT_URL` in the backend to your deployed frontend URL
- Use a strong random `JWT_SECRET`
- Use MongoDB Atlas for managed DB
- Frontend is served by Nginx in the Docker container

---

## License

MIT
