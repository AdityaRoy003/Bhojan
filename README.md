# 🍲 Bhojan — Next-Gen Food Delivery Ecosystem

<p align="center">
  <img src="frontend/public/bhojan-logo.svg" alt="Bhojan Logo" width="120" height="120" />
</p>

<p align="center">
  <strong>Hyper-local, community-driven food delivery platform designed for ultra-low latency, mobile-first performance, and enterprise-grade security.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Node.js-v22-green?logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-4.x-black?logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-brightgreen?logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Vite-v7-646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/PWA-Ready-orange" alt="PWA" />
  <img src="https://img.shields.io/badge/Security-Hardened-red" alt="Security" />
</p>

---

## 🌟 Overview

**Bhojan** is a full-stack food delivery platform inspired by the clean, intuitive design of Swiggy and Zomato. Built from the ground up with a mobile-first philosophy, it features real-time GPS tracking, gamified rewards, AI-powered contextual recommendations, multi-vendor kitchens, and an end-to-end hardened security architecture.

---

## 📱 Mobile-First UI/UX & Swiggy-Style Experience

* **Unified Top Bar**: Minimalist header layout: `Bhojan Logo | Delivering-To Location Selector (flex-1) | 🔔 Notifications | Profile Avatar`. Duplicate controls and visual clutter have been completely eliminated.
* **Location Selector Modal**: Auto-detects real-time location via browser GPS or allows manual search and override.
* **Sticky Category Chips Bar**: Horizontally scrollable food category ribbon directly under the hero banner that sticks to the top while scrolling:
  - 🍛 Biryani &bull; 🍕 Pizza &bull; 🍔 Burger &bull; 🍿 Snacks &bull; 🥢 Chinese &bull; 🫓 South Indian &bull; 🌯 Rolls &bull; 🍧 Dessert &bull; 🍲 Main Course &bull; 🍟 Fast Food &bull; 🍱 Thali
  - Instant live filtering by tapping any category chip, with active highlight badges.
* **Mobile Filters Bottom Sheet**: Smooth bottom-sheet drawer for sorting (Price, Rating, Delivery Time, Distance) and dietary preferences (Pure Veg, Non-Veg, Halal).
* **Pull-to-Refresh**: Native mobile swipe-down gesture to refresh restaurant feeds and live recommendations without reloading the page.
* **Streamlined Cart & Checkout**: Interactive step progress tracker, integrated promo code validator with bounds checking, and trust badges with zero overlapping elements on mobile viewports.

---

## 🔒 Enterprise Security & Hardening

* **OTP & Password Recovery Protection**:
  - Cryptographically random 6-digit OTP generation (`crypto.randomInt`).
  - Zero OTP leakage in API responses (development and fallback modes included).
  - Generic authentication responses to prevent user email enumeration.
* **Price Tampering Defenses & Server Validation**:
  - Total order prices and item amounts are queried and recalculated server-side against MongoDB records. Client payloads cannot manipulate prices.
  - Verification of Razorpay payment signatures (`HMAC-SHA256`) before marking transactions as paid.
* **IDOR & Mass-Assignment Prevention**:
  - Strict field whitelisting on Shop and Menu Item update endpoints (`updateShop`, `editItem`).
  - Real-time order tracking (`/api/tracking/:orderId`) is strictly restricted to the customer, assigned courier, restaurant owner, or system administrator.
* **Authentication & Account Lifecycle Guards**:
  - Tokens stored in secure `httpOnly`, `sameSite: 'lax'` cookies to prevent JavaScript XSS token theft.
  - Immediate request termination in JWT middleware for `Suspended` or `Banned` accounts.
  - Brute force protection: automatic 15-minute account lockout after 5 consecutive failed login attempts with security alert emails.
* **Attack Surface Hardening**:
  - `helmet` security headers with clickjacking (`frameguard: deny`) and MIME sniffing guards.
  - `mongo-sanitize` middleware protecting all request bodies, params, and query strings against NoSQL injection.
  - Automatic HTML/script tag stripping on all request payloads and live Socket.io chat messages.
  - Multi-tier rate limiting for global API, authentication, login/signup, and OTP recovery.
* **System Maintenance Gate**:
  - Instant platform-wide maintenance mode toggleable by administrators with live banner broadcasts and zero-downtime recovery.

---

## 🛵 Live Courier Tracking & Real-Time Logistics

* **Socket.io GPS Telemetry**: Real-time room-based courier location streaming (`track_${orderId}`) with smooth marker bearing rotation.
* **Haversine Distance & Dynamic ETA**: Continuous recalculation of distance (km) and estimated arrival time as the delivery partner approaches.
* **In-App Courier Chat**: Direct, real-time messaging between customer and rider with automated message sanitization.
* **Proof of Delivery & Geofencing**: Verification of rider arrival at restaurants and secure delivery OTP validation.

---

## 🎮 Gamification & AI Features

* **Interactive Spin-the-Wheel**: Daily interactive prize wheel with server-authoritative reward selection (discounts, free delivery).
* **Loyalty Quests & Badges**: Milestone-based challenges (e.g. "Foodie", "Cuisine Connoisseur") with redeemable loyalty points.
* **Contextual Suggestions**: Time and weather-aware banners (e.g. Monsoon snacks, late-night cravings).
* **Instagram-Style Food Stories**: Video and photo story feed highlighting local specialties and trending dishes.

---

## 👥 Multi-Role Ecosystem

| Role | Core Capabilities |
|---|---|
| **Customer** | Browse shops, live filter, group order, redeem coupons, live tracking, order history |
| **Restaurant Owner** | Menu management, real-time order acceptance, kitchen analytics, coupon creation |
| **Delivery Partner** | Online/offline toggle, order pickup/delivery workflow, earnings tracking, GPS sync |
| **Administrator** | User and shop verification, dispute resolution, platform maintenance mode, broadcast alerts |

---

## 🛠 Tech Stack

### Frontend
- **Core**: React 19, React Router v7, Redux Toolkit
- **Styling & Animation**: Tailwind CSS, Framer Motion
- **Maps & 3D**: Leaflet, React-Leaflet, Three.js
- **Tooling**: Vite 7, Progressive Web App (PWA) with Workbox offline caching

### Backend
- **Runtime**: Node.js v22, Express 4
- **Database**: MongoDB (Mongoose ODM)
- **Real-Time**: Socket.io
- **Security & Utilities**: Helmet, Mongo-Sanitize, bcryptjs, jsonwebtoken, Winston, Morgan
- **Payments & Communication**: Razorpay SDK, Nodemailer

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) running locally or MongoDB Atlas connection string

### 1. Clone the Repository
```bash
git clone https://github.com/AdityaRoy003/Bhojan.git
cd Bhojan
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory (see [`.env.example`](backend/.env.example)):
```env
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/bhojan
JWT_SECRET=your_generated_random_secret_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
