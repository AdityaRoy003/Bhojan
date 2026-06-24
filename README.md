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

## ✨ Premium Features & Updates

### 🏍️ Swiggy-Style Live Delivery Tracking
- **Smooth Marker Interpolation**: Rider markers (🏍️) utilize CSS bearing rotation and linear interpolation (lerp) over `requestAnimationFrame` for silky movement (no sudden jumps).
- **Haversine-based Live ETA**: Continuous calculations of distance and delivery times updating dynamically on every location ping.
- **Interactive Routing Map**: Uses dark custom Carto map tiles, displaying solid routes for traveled distances and dashed routes for remaining paths.
- **Coordinates Seeding & Self-Healing**: Automatic lookup of shop coordinates and randomized offset generation for drop-off addresses to guarantee map rendering and calculation accuracy.

### 📧 Premium Animated Email Notification System
- **Advanced Responsive UI**: Custom-branded email templates built with modern layouts, embedded CSS keyframe animations, and vector SVG logos.
- **Promotional & Marketing Campaigns**: Interactive templates for Festival Offers, Gamified Spin-the-Wheel discounts, and Post-Delivery Feedback requests with one-click rating stars.
- **Operational & Account Services**: Prime Membership renewal reminders and Referral code sharing templates.
- **Security & Privacy Alerts**: Automated templates for Login Alerts (new device/location), Suspicious Activity Alerts (failed login detections), Two-Factor (2FA) verification codes, Account Recovery, and GDPR Privacy Notices.

### 📸 Profile Photo Management
- **Interactive Hover Overlays**: Desktop/mobile user avatar displays a camera icon overlay on hover for quick uploads.
- **Clean Media Removals**: Form controls to easily remove profile pictures, integrated with backend handlers to cleanly clear avatars from databases.

### 🗺️ Operational & Fleet Onboarding
- **Partner Programs**: Clean onboarding templates for Restaurant Owners and Delivery Fleet riders at `/partner`.
- **Query Auto-Select**: Smart query parameters (`?role=Owner` or `?role=Delivery`) automatically pre-select registration options on the signup page.
- **Dark Mode Support**: Upgraded legal pages (Terms of Service, Privacy Policy) to support fully premium dark modes.

### 📱 Responsive Overlaps Prevention
- Prevent mobile navigation overlaps by introducing context-based padding (`pb-28 md:pb-8`) for footer elements, removing legacy placeholder links, and adding secure checkout trust badges.

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
- **GDPR Ready**: Cookie consent, data privacy sections, and account deletion workflows.
- **Transparency**: Live hygiene photos from kitchens and verified rider badges.
- **Security**: Robust RBAC (Role-Based Access Control) across all 100+ API endpoints.

---
*Created with ❤️ for Mithilanchal.*
