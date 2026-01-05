# Backend YouTube API 🎥

A production-ready backend API for a YouTube-like platform built with **Node.js, Express, MongoDB**, and deployed on **Render**.

- Built a production-ready REST API for a YouTube-like platform
- Implemented JWT authentication with access & refresh tokens
- Integrated Multer and Cloudinary for image uploads
- Secured passwords using bcrypt and Mongoose middleware
- Deployed backend to Render with MongoDB Atlas
- Designed modular MVC architecture with middleware-based validation

## 🚀 Live URL
https://backend-youtube-uvur.onrender.com

## 🧠 Features
- User registration with avatar & cover image upload
- JWT authentication (access & refresh tokens)
- Secure password hashing using bcrypt
- Cloudinary image storage
- Protected routes with middleware
- MongoDB Atlas integration
- Production deployment on Render

## 🛠 Tech Stack
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Multer (file uploads)
- Cloudinary
- Render (deployment)

## 📦 API Endpoints

## Auth
| Method | Route | Description |
|------|------|-------------|
| POST | /api/v1/users/register | Register user |
| POST | /api/v1/users/login | Login user |
| POST | /api/v1/users/logout | Logout user |
| POST | /api/v1/users/refresh-token | Refresh access token |
| POST | /api/v1/users/change-password | Change password |

## User
| Method | Route | Description |
|------|------|-------------|
| GET | /api/v1/users/current-user | Get logged-in user |
| PATCH | /api/v1/users/update-account | Update profile |
| PATCH | /api/v1/users/avatar | Update avatar |
| PATCH | /api/v1/users/cover-image | Update cover image |
| GET | /api/v1/users/c/:username | Get channel profile |


## ⚙️ Environment Variables
```env
PORT=8000
MONGODB_URI=your_mongodb_url
ACCESS_TOKEN_SECRET=your_secret
REFRESH_TOKEN_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx
