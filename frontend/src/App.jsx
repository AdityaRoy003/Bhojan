import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';
import CookieConsent from './components/CookieConsent';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

// Lazy Load Pages
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

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Navbar />
      <CookieConsent />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/shop/:id" element={<ShopDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<UserProfile />} />
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
      <Footer />
    </Router>
  );
}

export default App;
