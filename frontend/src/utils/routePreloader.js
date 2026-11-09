// Dynamic route preloader for secondary routes
const routeLoaders = {
    '/leaderboard': () => import('../pages/Leaderboard'),
    '/prime-membership': () => import('../pages/PrimeMembership'),
    '/owner/dashboard': () => import('../pages/owner/OwnerDashboard'),
    '/delivery/dashboard': () => import('../pages/delivery/DeliveryDashboard'),
    '/terms': () => import('../pages/TermsOfService'),
    '/privacy': () => import('../pages/PrivacyPolicy'),
    '/home-chefs': () => import('../pages/HomeChefs'),
};

const preloadedSet = new Set();

export const preloadRoute = (to) => {
    if (!to) return;
    const cleanPath = to.split('?')[0];
    if (preloadedSet.has(cleanPath)) return;

    const loader = routeLoaders[cleanPath];
    if (loader) {
        preloadedSet.add(cleanPath);
        loader().catch(() => {
            preloadedSet.delete(cleanPath);
        });
    }
};

export const warmAllCoreRoutes = () => {
    // Secondary routes pre-warmed after idle
    const warmTargets = ['/leaderboard', '/prime-membership', '/home-chefs'];
    warmTargets.forEach((target, index) => {
        setTimeout(() => {
            preloadRoute(target);
        }, 300 * (index + 1));
    });
};

