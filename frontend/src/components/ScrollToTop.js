import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
    const { pathname, search } = useLocation();

    useEffect(() => {
        // Prevent browser from restoring previous scroll positions on route/query changes
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }

        const resetScroll = () => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            const mainContent = document.querySelector('main.page-content');
            if (mainContent) {
                mainContent.scrollTop = 0;
            }
        };

        // Instant reset
        resetScroll();

        // Also ensure on next frame in case of asynchronous DOM layout changes
        const raf = requestAnimationFrame(() => {
            resetScroll();
        });

        return () => cancelAnimationFrame(raf);
    }, [pathname, search]);

    return null;
};

export default ScrollToTop;
