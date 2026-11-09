import React from 'react';

const RouteTopBar = () => {
    return (
        <div className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none">
            <div className="h-[3px] w-full bg-gradient-to-r from-orange-500 via-primary to-rose-600 animate-pulse shadow-[0_0_10px_rgba(230,57,70,0.8)]" />
        </div>
    );
};

export default RouteTopBar;
