import React, { Suspense, lazy, useEffect, useState, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, logoutUser } from './redux/userSlice';
import api from './utils/api';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';
import CookieConsent from './components/CookieConsent';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import BottomNav from './components/BottomNav';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MaintenancePage from './pages/MaintenancePage';

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
const Partner = lazy(() => import('./pages/Partner'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const PublicProfile = lazy(() => import('./pages/user/PublicProfile'));
const GroupCartScreen = lazy(() => import('./pages/GroupCartScreen'));
const HomeChefs = lazy(() => import('./pages/HomeChefs'));
const Notifications = lazy(() => import('./pages/Notifications'));

const CHROME_HIDDEN_ROUTES = ['/', '/login', '/signup', '/forgot-password', '/reset-password'];

// How often (ms) to re-check the maintenance status while the page is shown
const MAINTENANCE_POLL_INTERVAL = 30_000;

// Admin idle session timeout — 30 minutes of no activity forces logout
const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

function AppContent() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const hideChrome = CHROME_HIDDEN_ROUTES.includes(pathname);
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.user);
  const userRef = useRef(user);
  const idleTimerRef = useRef(null);

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false); // avoid flash

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // ── 1. Hydrate Redux user from the server cookie / Handle Session Security ─
  useEffect(() => {
    const isSessionActive = sessionStorage.getItem('activeSession') === 'true';
    if (isSessionActive) {
      api.get('/auth/me')
        .then(({ data }) => {
          if (data.success && data.user) dispatch(setUser(data.user));
        })
        .catch(() => {
          dispatch(logoutUser());
        });
    } else {
      // Fresh tab/session (e.g. clicked localhost link in terminal)
      // Forcefully log out from backend cookies to prevent automatic login of previous user
      api.get('/auth/logout')
        .catch(() => { /* ignore */ })
        .finally(() => {
          dispatch(logoutUser());
          sessionStorage.setItem('activeSession', 'true');
        });
    }
  }, [dispatch]);

  // ── Admin Idle Session Timeout ────────────────────────────────────────────
  // If the admin is inactive for 30 minutes, they are automatically signed out.
  // This prevents stale admin sessions persisting in the browser.
  const handleAdminLogout = useCallback(async () => {
    try { await api.get('/auth/logout'); } catch (_) { /* ignore */ }
    dispatch(logoutUser());
    navigate('/login', { replace: true });
    // Use a brief delay so the navigate fires before the toast
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('bhojan:idle-logout'));
    }, 100);
  }, [dispatch, navigate]);

  useEffect(() => {
    const isAdmin = userRef.current?.role === 'Admin';
    if (!isAdmin) return; // Only enforce for admins

    const resetTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(handleAdminLogout, ADMIN_IDLE_TIMEOUT_MS);
    };

    const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer(); // Start timer immediately on login

    return () => {
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, resetTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, handleAdminLogout]);

  // ── 2. Check maintenance status ───────────────────────────────────────────
  // IMPORTANT: Always reads from userRef so polling never uses a stale closure.
  const checkMaintenance = async () => {
    try {
      const res = await fetch(`/api/status?t=${Date.now()}`);
      const data = await res.json();

      const isAdmin = userRef.current?.role === 'Admin';

      if (isAdmin) {
        setMaintenanceMode(false);
      } else {
        setMaintenanceMode(data.maintenanceMode === true);
      }
    } catch {
      // If server is totally unreachable, only block non-admins
      if (userRef.current?.role !== 'Admin') {
        setMaintenanceMode(true);
      }
    } finally {
      setStatusChecked(true);
    }
  };

  // Re-check maintenance only when the user's ROLE or ID changes
  // (NOT on every object reference change which would cause an infinite loop)
  const userRole = user?.role ?? null;
  const userId   = user?._id  ?? null;
  useEffect(() => {
    checkMaintenance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, userId]);

  // ── 3. Poll every 30 s to auto-detect maintenance status changes ──────────
  useEffect(() => {
    const id = setInterval(checkMaintenance, MAINTENANCE_POLL_INTERVAL);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 4. Listen for maintenance events fired by the api.js interceptor ──────
  // When any API call returns 503+maintenance:true, re-check status immediately.
  // This replaces the old window.location.reload() approach and prevents the
  // flicker/reload loop when an admin user's dashboard API calls are blocked.
  useEffect(() => {
    const handler = () => checkMaintenance();
    window.addEventListener('bhojan:maintenance-detected', handler);
    return () => window.removeEventListener('bhojan:maintenance-detected', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ── 5. Don't flash anything before first status check ────────────────────
  if (!statusChecked) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29, #1a1040)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Loader />
      </div>
    );
  }

  // ── 5. Maintenance mode rendering ────────────────────────────────────────
  // /login is ALWAYS accessible so the admin can sign in and turn off maintenance.
  // Every other route shows the maintenance page.
  const isAdmin = user?.role === 'Admin';
  if (maintenanceMode && !isAdmin) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Only the login page is accessible during maintenance */}
            <Route path="/login" element={<Login />} />
            {/* Everything else → maintenance page */}
            <Route path="*" element={<MaintenancePage />} />
          </Routes>
        </Suspense>
      </>
    );
  }

  return (
    <>
      <ScrollToTop />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
      {!hideChrome && <Navbar />}
      <CookieConsent />
      <main className="page-content">
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
          <Route path="/partner" element={<Partner />} />
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
      </main>
      {/* Footer is desktop-only; BottomNav handles mobile navigation */}
      {!hideChrome && <div className="hidden md:block"><Footer /></div>}
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
