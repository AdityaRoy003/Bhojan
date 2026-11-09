// Dynamic route preloader for near-instant 0ms navigation transitions

const routeLoaders = {
    '/home': () => import('../pages/Home'),
    '/cart': () => import('../pages/Cart'),
    '/profile': () => import('../pages/user/UserProfile'),
    '/notifications': () => import('../pages/Notifications'),
    '/checkout': () => import('../pages/Checkout'),
    '/login': () => import('../pages/Login'),
    '/signup': () => import('../pages/Signup'),
    '/leaderboard': () => import('../pages/Leaderboard'),
    '/prime-membership': () => import('../pages/PrimeMembership'),
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
    // Eagerly preload common customer routes into memory after initial paint
    const warmTargets = ['/home', '/cart', '/profile', '/notifications', '/checkout'];
    warmTargets.forEach((target, index) => {
        setTimeout(() => {
            preloadRoute(target);
        }, 100 * (index + 1));
    });
};
