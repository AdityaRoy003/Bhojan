# 🍛 Bhojan - Fusion Food Delivery Platform

Bhojan is a premium, high-performance food delivery ecosystem designed specifically for the Mithilanchal region. It combines advanced UI/UX (Swiggy-inspired) with a robust MERN stack, featuring AI-driven personalization, gamification, and a deep community layer.

---

## 🚀 Vision & Innovation
Bhojan goes beyond simple ordering. It is a **hyper-local community platform** that empowers local vendors while providing customers with an interactive, fun, and personalized experience.

### 🧠 AI & Personalization
- **Predictive Meal Planning**: Suggests weekly meal plans based on dietary preferences and past orders.
- **Mood-Based Suggestions**: Dynamic banners ("Hot Pakoras on a rainy evening") using real-time context.
- **Chatbot Concierge**: AI-powered assistant for instant resolution of queries and order tracking.

### 🎮 Gamification (Engagement Engine)
- **Spin-the-Wheel**: Physics-based interactive wheel for winning real discount coupons.
- **Food Quests**: Milestone challenges (e.g., "Order 5 Cuisines this month") to earn badges and rewards.
- **Loyalty HUD**: Real-time progress visualization for free delivery and tier-based perks.

### 🌐 Social & Community Layer
- **Food Stories**: Instagram-style vertical video/photo reviews for dishes.
- **Follow System**: Direct connection between customers and their favorite local vendors.
- **Leaderboards**: Friendly competition among top foodies, restaurants, and top-rated delivery partners.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 (Vite-powered)
- **Styling**: Tailwind CSS & Vanilla CSS
- **Animations**: Framer Motion (Slide-up drawers, parallax effects, physics animations)
- **State Management**: Redux Toolkit
- **PWA**: Fully installable Progressive Web App with offline caching.

### Backend
- **Runtime**: Node.js & Express
- **Database**: MongoDB (with advanced indexing)
- **Caching**: Redis (High-performance caching for shops and menus)
- **Security**: JWT Authentication, Express-rate-limit, Mongo-Sanitize
- **Communication**: Integrated Email (Nodemailer) & SMS alerts

### Operations & Infrastructure
- **Containerization**: Docker & Docker Compose
- **Monitoring**: Winston & Morgan (Centralized logging)
- **Deployment**: Configured for Vercel/Render/Docker environments.

---

## 📱 Premium Mobile UX
*Built with a "Mobile-First" philosophy:*
- **Sticky Actions**: Swiggy-style sticky cart footer and checkout buttons.
- **Dynamic Drawers**: Professional slide-up drawers for accounts and order tracking.
- **Gesture Control**: Swipe gestures for cart management.
- **Active Tracking**: Real-time order timeline with ETA and partner details on the home screen.

---

## 👑 Diverse Roles
1. **Customer**: Browsing, Social, Gamification, and Wallet systems.
2. **Owner**: Multi-brand Cloud Kitchen management, Analytics Dashboard, and Payout history.
3. **Delivery Partner**: Smart shift planning, navigation, and performance tracking.
4. **Admin**: Enterprise-level moderation, platform financials, and fleet management.

---

## 🛠 Setup & Running

### Prerequisites
- Node.js (v18+)
- MongoDB & Redis
- Docker (Optional)

### Development
1. **Clone the repo**: `git clone...`
2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Docker (Recommended)
```bash
docker-compose up --build
```

---

## ⚖️ Compliance & Trust
- **GPDR Ready**: Cookie consent, data privacy sections, and account deletion workflows.
- **Transparency**: Live hygiene photos from kitchens and verified rider badges.
- **Security**: Robust RBAC (Role-Based Access Control) across all 100+ API endpoints.

---
*Created with ❤️ for Mithilanchal.*
