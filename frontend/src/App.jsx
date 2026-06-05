import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';
import CookieConsent from './components/CookieConsent';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import BottomNav from './components/BottomNav';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Lazy Load Pages
const Landing = lazy(() => import('./pages/Landing'));
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ShopDetails = lazy(() => import('./pages/ShopDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const UserProfile = lazy(() => import('./pages/user/UserProfile'));
const OwnerDashboard = lazy(() => import('./pages/owner/OwnerDashboard'));
const DeliveryDashboard = lazy(() => import('./pages/delivery/DeliveryDashboard'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const PrimeMembership = lazy(() => import('./pages/PrimeMembership'));
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));
const VirtualBrandManager = lazy(() => import('./pages/VirtualBrandManager'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const PublicProfile = lazy(() => import('./pages/user/PublicProfile'));
const GroupCartScreen = lazy(() => import('./pages/GroupCartScreen'));
const HomeChefs = lazy(() => import('./pages/HomeChefs'));
const Notifications = lazy(() => import('./pages/Notifications'));

const CHROME_HIDDEN_ROUTES = ['/', '/login', '/signup', '/forgot-password', '/reset-password'];

function AppContent() {
  const { pathname } = useLocation();
  const hideChrome = CHROME_HIDDEN_ROUTES.includes(pathname);

  return (
    <>
      <ScrollToTop />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
      {!hideChrome && <Navbar />}
      <CookieConsent />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Home />} />
          <Route path="/home-chefs" element={<HomeChefs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/shop/:id" element={<ShopDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/user/:id" element={<PublicProfile />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/group-cart/:partyId" element={<GroupCartScreen />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/track/:orderId" element={<OrderTracking />} />
            <Route path="/prime-membership" element={<PrimeMembership />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Owner']} />}>
            <Route path="/owner/dashboard" element={<OwnerDashboard />} />
            <Route path="/owner/virtual-brands" element={<VirtualBrandManager />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Delivery']} />}>
            <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
          </Route>
        </Routes>
      </Suspense>
      {!hideChrome && <Footer />}
      {!hideChrome && <BottomNav />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
