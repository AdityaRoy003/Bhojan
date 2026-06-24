// Bhojan — Premium Responsive Email Templates with Embedded CSS Animations & SVG Brand Logo
const BRAND_COLOR = '#ff4d4d';
const BRAND_DARK = '#1a1a1a';
const BRAND_GOLD = '#d4af37';

// Vector Brand Logo SVG (HTML Inline-compatible)
const brandLogoSVG = `
<svg width="55" height="55" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: 0 auto 15px auto; display: block; filter: drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.12));">
  <circle cx="50" cy="50" r="46" fill="#ffffff" />
  <path d="M25 55C25 65 35 75 50 75C65 75 75 65 75 55H25Z" fill="#ff4d4d" />
  <path d="M20 48H80V52H20V48Z" fill="#1a1a1a" />
  <path d="M38 32C38 32 42 22 45 22C48 22 46 32 46 32" stroke="#ff4d4d" stroke-width="4" stroke-linecap="round" />
  <path d="M50 32C50 32 54 22 57 22C60 22 58 32 58 32" stroke="#ff4d4d" stroke-width="4" stroke-linecap="round" />
  <circle cx="38" cy="62" r="3.5" fill="#ffffff" />
  <circle cx="62" cy="62" r="3.5" fill="#ffffff" />
</svg>
`;

const emailStyles = `
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
    body {
        font-family: 'Outfit', 'Segoe UI', sans-serif;
        background-color: #f6f9fc;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
    }
    .email-container {
        max-width: 600px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        border: 1px solid #eef2f6;
    }
    .header-gradient {
        background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #ff7676 100%);
        padding: 40px 20px;
        text-align: center;
        position: relative;
    }
    .header-gold {
        background: linear-gradient(135deg, ${BRAND_DARK} 0%, #2a2a2a 100%);
        border-bottom: 4px solid ${BRAND_GOLD};
        padding: 40px 20px;
        text-align: center;
    }
    .header-security {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        padding: 40px 20px;
        text-align: center;
        border-bottom: 4px solid #f59e0b;
    }
    .content-body {
        padding: 40px;
        color: #334155;
        line-height: 1.6;
    }
    .btn-pulse {
        display: inline-block;
        background: ${BRAND_COLOR};
        color: #ffffff !important;
        padding: 14px 30px;
        text-decoration: none;
        border-radius: 14px;
        font-weight: 700;
        font-size: 14px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        box-shadow: 0 4px 15px rgba(255, 77, 77, 0.3);
        transition: all 0.3s ease;
        animation: pulse 2s infinite;
    }
    .btn-pulse:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(255, 77, 77, 0.4);
    }
    .btn-gold {
        display: inline-block;
        background: linear-gradient(135deg, ${BRAND_GOLD} 0%, #f3cd45 100%);
        color: ${BRAND_DARK} !important;
        padding: 14px 30px;
        text-decoration: none;
        border-radius: 14px;
        font-weight: 700;
        font-size: 14px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
        transition: all 0.3s ease;
        animation: pulse 2.5s infinite;
    }
    .btn-gold:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(212, 175, 55, 0.5);
    }
    .btn-security {
        display: inline-block;
        background: #f59e0b;
        color: #ffffff !important;
        padding: 14px 30px;
        text-decoration: none;
        border-radius: 14px;
        font-weight: 700;
        font-size: 14px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
        transition: all 0.3s ease;
    }
    .btn-security:hover {
        transform: translateY(-2px);
        background: #d97706;
    }
    .footer {
        background-color: #f8fafc;
        padding: 30px 40px;
        text-align: center;
        font-size: 12px;
        color: #64748b;
        border-top: 1px solid #f1f5f9;
    }
    .star-rating {
        font-size: 0;
        margin: 20px 0;
    }
    .star-link {
        font-size: 36px;
        color: #cbd5e1;
        text-decoration: none;
        margin: 0 5px;
        transition: all 0.2s ease;
    }
    .star-link:hover {
        color: #fbbf24;
        transform: scale(1.2);
        text-shadow: 0 0 10px rgba(251,191,36,0.5);
    }
    .spin-wheel-container {
        position: relative;
        width: 200px;
        height: 200px;
        margin: 30px auto;
    }
    .spin-wheel {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 8px solid ${BRAND_DARK};
        animation: spin 8s linear infinite;
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    }
    .spin-pointer {
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 15px solid transparent;
        border-right: 15px solid transparent;
        border-top: 25px solid ${BRAND_COLOR};
        z-index: 10;
        filter: drop-shadow(0 2px 5px rgba(0,0,0,0.2));
    }
    .coupon-card {
        background: #f8fafc;
        border: 2px dashed #cbd5e1;
        border-radius: 16px;
        padding: 20px;
        margin: 20px 0;
        text-align: center;
        transition: all 0.3s ease;
    }
    .coupon-code {
        font-size: 24px;
        font-weight: 800;
        color: ${BRAND_COLOR};
        letter-spacing: 2px;
        margin: 10px 0;
    }
    
    /* Security Verification Code Styling */
    .otp-card {
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 20px;
        padding: 24px 40px;
        display: inline-block;
        font-size: 36px;
        font-weight: 850;
        letter-spacing: 8px;
        color: #0f172a;
        box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        margin: 25px 0;
        animation: otpGlow 2.2s infinite ease-in-out;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); box-shadow: 0 4px 15px rgba(255, 77, 77, 0.3); }
        50% { transform: scale(1.03); box-shadow: 0 4px 25px rgba(255, 77, 77, 0.5); }
        100% { transform: scale(1); box-shadow: 0 4px 15px rgba(255, 77, 77, 0.3); }
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    .floating-accent {
        animation: float 3s ease-in-out infinite;
    }
    @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
        100% { transform: translateY(0px); }
    }
    @keyframes otpGlow {
        0% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.15); border-color: #fca5a5; transform: scale(1); }
        50% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.35); border-color: #ef4444; transform: scale(1.02); }
        100% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.15); border-color: #fca5a5; transform: scale(1); }
    }
</style>
`;

const emailTemplates = {
    // Redesigned Order Confirmation Email
    orderConfirmation: (order) => `
        <html>
        <head>${emailStyles}</head>
        <body>
            <div class="email-container">
                <div class="header-gradient">
                    ${brandLogoSVG}
                    <h1 class="floating-accent" style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Bhojan</h1>
                    <p style="color: #ffe4e4; font-size: 14px; margin-top: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Deliciousness Delivered</p>
                </div>
                <div class="content-body">
                    <h2 style="color: #1e293b; font-weight: 800; margin-top: 0; font-size: 24px;">Order Confirmed! 🎉</h2>
                    <p>Hi <b>${order.user.fullname}</b>, get ready to indulge! Your order <b>#${order._id.toString().slice(-6).toUpperCase()}</b> has been placed successfully.</p>
                    
                    <div style="background: #f8fafc; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; margin: 25px 0;">
                        <h3 style="margin-top: 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">Order Summary</h3>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            ${order.items.map(item => `
                                <li style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px;">
                                    <span style="color: #334155; font-weight: 600;">${item.name} <span style="color: #94a3b8; font-weight: 400;">x ${item.quantity}</span></span>
                                    <span style="font-weight: 800; color: #1e293b;">₹${item.price * item.quantity}</span>
                                </li>
                            `).join('')}
                        </ul>
                        <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 20px 0;">
                        <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 18px; color: #1e293b;">
                            <span>Total Amount:</span>
                            <span style="color: ${BRAND_COLOR};">₹${order.totalAmount}</span>
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 35px;">
                        <a href="${process.env.FRONTEND_URL}/track/${order._id}" class="btn-pulse">Track Your Order 🛵</a>
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; 2026 Bhojan. All rights reserved.</p>
                    <p style="margin-top: 5px; font-size: 10px; color: #94a3b8;">If you have any questions, please contact support.</p>
                </div>
            </div>
        </body>
        </html>
    `,

    // Redesigned Status Update Email
    statusUpdate: (order, status) => `
        <html>
        <head>${emailStyles}</head>
        <body>
            <div class="email-container">
                <div class="header-gradient">
                    ${brandLogoSVG}
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800;">Bhojan</h1>
                    <p style="color: #ffe4e4; font-size: 14px; margin-top: 5px; font-weight: 600; text-transform: uppercase;">Status Update</p>
                </div>
                <div class="content-body" style="text-align: center;">
                    <div style="font-size: 60px; margin-bottom: 20px; display: inline-block;" class="floating-accent">
                        ${status === 'Preparing' ? '🍳' : status === 'Out for Delivery' ? '🚴' : status === 'Delivered' ? '✅' : '📦'}
                    </div>
                    <h2 style="color: #1e293b; font-weight: 800; font-size: 24px; margin-top: 0;">Order Status: ${status}!</h2>
                    <p style="font-size: 16px; color: #475569;">Your order <b>#${order._id.toString().slice(-6).toUpperCase()}</b> is moving fast. Our team is ensuring your food is hot and delicious.</p>
                    
                    <div style="text-align: center; margin-top: 35px;">
                        <a href="${process.env.FRONTEND_URL}/track/${order._id}" class="btn-pulse">Check Live Status</a>
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; 2026 Bhojan. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `,

    // Redesigned Forgot Password / OTP Recovery
    forgotPassword: (otp) => `
        <html>
        <head>${emailStyles}</head>
        <body>
            <div class="email-container">
                <div class="header-security">
                    ${brandLogoSVG}
                    <h1 style="color: #ffffff; margin: 0; font-size: 30px; font-weight: 800;">Bhojan Security</h1>
                    <p style="color: #fbcfe8; font-size: 13px; margin-top: 5px; font-weight: 600; text-transform: uppercase;">Password Recovery</p>
                </div>
                <div class="content-body" style="text-align: center;">
                    <div style="font-size: 50px; animation: float 3s ease-in-out infinite; display: inline-block; margin-bottom: 10px;">🔐</div>
                    <h2 style="color: #1e293b; font-weight: 800; font-size: 22px; margin-top: 0;">Verification Code</h2>
                    <p>Use the secure verification code below to reset your Bhojan password. This code is active for 10 minutes.</p>
                    
                    <div class="otp-card">
                        ${otp}
                    </div>

                    <p style="font-size: 13px; color: #64748b; margin-top: 15px;">If you did not request this, please secure your account immediately or ignore this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2026 Bhojan Security. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `,

    // Promo: Festival Offer
    festivalOffer: (campaign) => `
        <html>
        <head>${emailStyles}</head>
        <body>
            <div class="email-container">
                <div class="header-gradient" style="background: linear-gradient(135deg, #f97316 0%, #e11d48 100%);">
                    ${brandLogoSVG}
                    <h1 class="floating-accent" style="color: #ffffff; margin: 0; font-size: 34px; font-weight: 800; text-shadow: 0 3px 6px rgba(0,0,0,0.15);">✨ ${campaign.festivalName || 'Festival Special'} ✨</h1>
                    <p style="color: #ffedd5; font-size: 14px; margin-top: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">Exclusive Festive Celebration</p>
                </div>
                <div class="content-body" style="text-align: center;">
                    <h2 style="color: #1e293b; font-weight: 800; font-size: 26px; margin-top: 0;">Unwrap Delicious Discounts! 🎁</h2>
                    <p style="font-size: 16px;">Celebrate this festive season with your favorite meals. We've added a special discount coupon to your account.</p>
                    
                    <div class="coupon-card">
                        <span style="font-size: 12px; font-weight: 800; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1.5px;">Your Coupon Code</span>
                        <div class="coupon-code">${campaign.couponCode || 'FESTIVE50'}</div>
                        <span style="font-size: 20px; font-weight: 800; color: #1e293b;">Get ${campaign.discountPercent || '50'}% OFF</span>
                    </div>

                    <p style="font-size: 14px; color: #475569;">Valid on all home-chef and local partner orders. Hurry, offer expires soon!</p>

                    <div style="text-align: center; margin-top: 35px;">
                        <a href="${process.env.FRONTEND_URL}/home" class="btn-pulse" style="background: linear-gradient(135deg, #f97316 0%, #e11d48 100%); box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);">Claim Festive Feast 🍲</a>
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; 2026 Bhojan Campaigns. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `,

    // Promo: Spin The Wheel Gamified Email
    spinTheWheel: (campaign) => `
        <html>
        <head>${emailStyles}</head>
        <body>
            <div class="email-container">
                <div class="header-gradient" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
                    ${brandLogoSVG}
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800;">🎡 Spin & Win!</h1>
                    <p style="color: #e0e7ff; font-size: 14px; margin-top: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Gamified Food Rewards</p>
                </div>
                <div class="content-body" style="text-align: center;">
                    <h2 style="color: #1e293b; font-weight: 800; font-size: 24px; margin-top: 0;">Spin The Wheel for Food Discounts!</h2>
                    <p>Are you feeling lucky today? Spin our magic wheel to unlock discounts, free deliveries, or wallet cashbacks instantly.</p>
                    
                    <div class="spin-wheel-container">
                        <div class="spin-pointer"></div>
                        <svg class="spin-wheel" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="#4f46e5" stroke="#ffffff" stroke-width="2"/>
                            <path d="M50 50 L50 10 A40 40 0 0 1 85 30 Z" fill="#ff4d4d"/>
                            <path d="M50 50 L85 30 A40 40 0 0 1 85 70 Z" fill="#fbbf24"/>
                            <path d="M50 50 L85 70 A40 40 0 0 1 50 90 Z" fill="#34d399"/>
                            <path d="M50 50 L50 90 A40 40 0 0 1 15 70 Z" fill="#60a5fa"/>
                            <path d="M50 50 L15 70 A40 40 0 0 1 15 30 Z" fill="#f43f5e"/>
                            <path d="M50 50 L15 30 A40 40 0 0 1 50 10 Z" fill="#a78bfa"/>
                            <circle cx="50" cy="50" r="10" fill="#ffffff" stroke="#1a1a1a" stroke-width="3"/>
                        </svg>
                    </div>

                    <div style="text-align: center; margin-top: 35px;">
                        <a href="${process.env.FRONTEND_URL}/profile?spin=true" class="btn-pulse" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);">Spin the Wheel Now 🎡</a>
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; 2026 Bhojan Play. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `,

    // Promo: Feedback Emails with One-click rating stars
    feedbackRating: (campaign) => `
        <html>
        <head>${emailStyles}</head>
        <body>
            <div class="email-container">
                <div class="header-gradient">
                    ${brandLogoSVG}
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800;">🍽️ How was your meal?</h1>
                    <p style="color: #ffe4e4; font-size: 14px; margin-top: 5px; font-weight: 600; text-transform: uppercase;">Feedback Request</p>
                </div>
                <div class="content-body" style="text-align: center;">
                    <h2 style="color: #1e293b; font-weight: 800; font-size: 24px; margin-top: 0;">Rate Your Delivery</h2>
                    <p>Your opinion is extremely important to us. Rate your recent delivery of order <b>#${campaign.orderId?.toString().slice(-6).toUpperCase() || 'RECENT'}</b> with just one click below:</p>
                    
                    <div class="star-rating">
                        <a href="${process.env.FRONTEND_URL}/profile?feedback=1&orderId=${campaign.orderId || ''}" class="star-link">★</a>
                        <a href="${process.env.FRONTEND_URL}/profile?feedback=2&orderId=${campaign.orderId || ''}" class="star-link">★</a>
                        <a href="${process.env.FRONTEND_URL}/profile?feedback=3&orderId=${campaign.orderId || ''}" class="star-link">★</a>
                        <a href="${process.env.FRONTEND_URL}/profile?feedback=4&orderId=${campaign.orderId || ''}" class="star-link">★</a>
                        <a href="${process.env.FRONTEND_URL}/profile?feedback=5&orderId=${campaign.orderId || ''}" class="star-link">★</a>
                    </div>

                    <p style="font-size: 13px; color: #64748b;">Clicking a star will securely open your profile page to complete the rating details.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2026 Bhojan Feedback. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `,

    // Promo: Prime Membership Renewal / Perk Info
    primeMembership: (campaign) => `
        <html>
        <head>${emailStyles}</head>
        <body>
            <div class="email-container">
                <div class="header-gold">
                    ${brandLogoSVG}
                    <h1 class="floating-accent" style="color: ${BRAND_GOLD}; margin: 0; font-size: 30px; font-weight: 800;">BHOJAN PRIME</h1>
                    <p style="color: #a1a1aa; font-size: 12px; margin-top: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">Premium Membership Perks</p>
                </div>
                <div class="content-body">
                    <h2 style="color: #1a1a1a; font-weight: 800; font-size: 22px; margin-top: 0;">Upgrade / Renew Your Prime Status</h2>
                    <p>It's time to supercharge your ordering. Don't lose out on priority cooking, free delivery vouchers, and luxury offers made just for Prime members.</p>
                    
                    <div style="background: #fafaf9; border: 1px solid #e7e5e4; padding: 25px; border-radius: 20px; margin: 25px 0;">
                        <h3 style="margin-top: 0; font-size: 14px; color: ${BRAND_GOLD}; font-weight: 800; text-transform: uppercase;">Exclusive Perks Summary</h3>
                        <ul style="padding-left: 20px; margin: 10px 0; font-size: 15px; color: #44403c;">
                            <li style="margin-bottom: 8px;">🚀 <strong>Free Delivery</strong> on all orders above ₹199</li>
                            <li style="margin-bottom: 8px;">⚡ <strong>Express Kitchen Prep</strong> (Average 7 mins faster cooking)</li>
                            <li style="margin-bottom: 8px;">💎 <strong>Double Reward Points</strong> on every order placed</li>
                            <li style="margin-bottom: 8px;">📞 <strong>Priority VIP Support</strong> with instant escalation</li>
                        </ul>
                    </div>

                    <div style="text-align: center; margin-top: 35px;">
                        <a href="${process.env.FRONTEND_URL}/prime-membership" class="btn-gold">Renew Membership 👑</a>
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; 2026 Bhojan Prime. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `,

    // Promo: Referral Emails
    referral: (campaign) => `
        <html>
        <head>${emailStyles}</head>
        <body>
            <div class="email-container">
                <div class="header-gradient" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                    ${brandLogoSVG}
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800;">Spread the Taste</h1>
                    <p style="color: #d1fae5; font-size: 14px; margin-top: 5px; font-weight: 600; text-transform: uppercase;">Referral Bonus</p>
                </div>
                <div class="content-body" style="text-align: center;">
                    <h2 style="color: #1e293b; font-weight: 800; font-size: 24px; margin-top: 0;">Invite Friends & Earn Points!</h2>
                    <p>Share your love for delicious home-cooked food. Refer your friends to Bhojan. When they sign up, both of you get **500 Loyalty Points** instantly!</p>
                    
                    <div class="coupon-card" style="border-color: #34d399; background: #f0fdf4;">
                        <span style="font-size: 12px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 1.5px;">Your Unique Code</span>
                        <div class="coupon-code" style="color: #059669;">${campaign.referralCode || 'REFERRAL500'}</div>
                        <span style="font-size: 15px; font-weight: 600; color: #1e293b;">Friend gets 500 Pts • You get 500 Pts</span>
                    </div>

                    <div style="text-align: center; margin-top: 35px;">
                        <a href="${process.env.FRONTEND_URL}/profile" class="btn-pulse" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">Share Referral Code</a>
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; 2026 Bhojan Network. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `,

    // Security: Login Alert
    loginAlert: (details) => `
        <html>
        <head>${emailStyles}</head>
        <body>
            <div class="email-container">
                <div class="header-security">
                    ${brandLogoSVG}
                    <h1 style="color: #ffffff; margin: 0; font-size: 30px; font-weight: 800;">Security Alert</h1>
                    <p style="color: #fef3c7; font-size: 12px; margin-top: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">New Login Detected</p>
                </div>
                <div class="content-body">
                    <h2 style="color: #1e293b; font-weight: 800; font-size: 20px; margin-top: 0;">New Device Login</h2>
                    <p>Your Bhojan account was accessed from a device or location we don't recognize. Review details below:</p>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin: 20px 0; font-size: 14px; color: #475569;">
                        <table style="width: 100%;">
                            <tr><td style="padding: 6px 0; font-weight: bold; width: 120px;">Device:</td><td>${details.browser || 'Unknown'} / ${details.os || 'Unknown'}</td></tr>
                            <tr><td style="padding: 6px 0; font-weight: bold;">Date & Time:</td><td>${details.timestamp || new Date().toLocaleString()}</td></tr>
                            <tr><td style="padding: 6px 0; font-weight: bold;">IP Address:</td><td>${details.ip || 'Unknown'}</td></tr>
                        </table>
                    </div>

                    <p>If this was you, no action is needed. If you do not recognize this login, secure your account immediately by resetting your password.</p>

                    <div style="text-align: center; margin-top: 35px;">
                        <a href="${process.env.FRONTEND_URL}/forgot-password" class="btn-security">Secure Account Now 🔒</a>
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; 2026 Bhojan Security. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `,

    // Security: Suspicious Activity Alert
    suspiciousActivity: (details) => `
        <html>
        <head>${emailStyles}</head>
        <body>
            <div class="email-container">
                <div class="header-security" style="border-bottom-color: #ef4444;">
                    ${brandLogoSVG}
                    <h1 style="color: #ffffff; margin: 0; font-size: 30px; font-weight: 800;">Critical Warning</h1>
                    <p style="color: #fee2e2; font-size: 12px; margin-top: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Suspicious Login Attempts</p>
                </div>
                <div class="content-body">
                    <h2 style="color: #ef4444; font-weight: 800; font-size: 20px; margin-top: 0;">Multiple Failed Logins</h2>
                    <p>Our security system detected <b>${details.attempts || 3} consecutive failed login attempts</b> on your Bhojan account.</p>
                    
                    <div style="background: #fff5f5; border: 1px solid #feb2b2; padding: 20px; border-radius: 16px; margin: 20px 0; color: #9b2c2c; font-size: 14px;">
                        <strong>Security Details:</strong>
                        <ul style="margin: 10px 0 0 20px; padding: 0;">
                            <li>Account status: ${details.isLocked ? '🔐 Locked for 15 minutes' : '⚠️ Warning'}</li>
                            <li>IP Address: ${details.ip || 'Unknown'}</li>
                            <li>Attempt time: ${new Date().toLocaleString()}</li>
                        </ul>
                    </div>

                    <p>If this was not you, someone else may be trying to access your account. We highly recommend updating your credentials immediately.</p>

                    <div style="text-align: center; margin-top: 35px;">
                        <a href="${process.env.FRONTEND_URL}/forgot-password" class="btn-security" style="background-color: #ef4444;">Reset Password 🔑</a>
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; 2026 Bhojan Security. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `,

    // Security: Two-Factor Verification
    twoFactorVerification: (details) => `
        <html>
        <head>${emailStyles}</head>
        <body>
            <div class="email-container">
                <div class="header-security">
                    ${brandLogoSVG}
                    <h1 style="color: #ffffff; margin: 0; font-size: 30px; font-weight: 800;">Two-Factor Verification</h1>
                    <p style="color: #fef3c7; font-size: 12px; margin-top: 5px; font-weight: 600; text-transform: uppercase;">Login Authorization</p>
                </div>
                <div class="content-body" style="text-align: center;">
                    <div style="font-size: 50px; animation: float 3s ease-in-out infinite; display: inline-block; margin-bottom: 10px;">🔒</div>
                    <h2 style="color: #1e293b; font-weight: 800; font-size: 22px;">Security Verification Code</h2>
                    <p>Two-factor authentication is active on your account. Use the code below to complete authorization. Valid for 10 minutes.</p>
                    
                    <div class="otp-card">
                        ${details.code}
                    </div>

                    <p style="font-size: 13px; color: #64748b; margin-top: 15px;">If you are locked out, you can use one of your backup recovery codes to log in.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2026 Bhojan Security. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `,

    // Security: Account Recovery step-by-step
    accountRecovery: (details) => `
        <html>
        <head>${emailStyles}</head>
        <body>
            <div class="email-container">
                <div class="header-security">
                    ${brandLogoSVG}
                    <h1 style="color: #ffffff; margin: 0; font-size: 30px; font-weight: 800;">Account Recovery</h1>
                    <p style="color: #fef3c7; font-size: 12px; margin-top: 5px; font-weight: 600; text-transform: uppercase;">Step-by-Step Restoration</p>
                </div>
                <div class="content-body">
                    <h2 style="color: #1e293b; font-weight: 800; font-size: 20px; margin-top: 0;">Recovery Guidance</h2>
                    <p>You requested account recovery support. Follow these steps to restore active login capabilities securely:</p>
                    
                    <ol style="padding-left: 20px; font-size: 15px; color: #475569; line-height: 1.8;">
                        <li style="margin-bottom: 10px;">Click the <strong>Reset Credentials</strong> link below.</li>
                        <li style="margin-bottom: 10px;">Enter your registered recovery email to receive a secure OTP code.</li>
                        <li style="margin-bottom: 10px;">Input the OTP and choose a new password.</li>
                        <li style="margin-bottom: 10px;">Verify your recovery settings in <strong>Profile Settings -> Security</strong>.</li>
                    </ol>

                    <div style="text-align: center; margin-top: 35px;">
                        <a href="${process.env.FRONTEND_URL}/forgot-password" class="btn-security">Reset Credentials</a>
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; 2026 Bhojan Security. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `,

    // Security: Data Privacy Notice
    dataPrivacyNotice: (details) => `
        <html>
        <head>${emailStyles}</head>
        <body>
            <div class="email-container">
                <div class="header-security">
                    ${brandLogoSVG}
                    <h1 style="color: #ffffff; margin: 0; font-size: 30px; font-weight: 800;">Privacy & GDPR</h1>
                    <p style="color: #fef3c7; font-size: 12px; margin-top: 5px; font-weight: 600; text-transform: uppercase;">Compliance Notice</p>
                </div>
                <div class="content-body">
                    <h2 style="color: #1e293b; font-weight: 800; font-size: 20px; margin-top: 0;">Privacy Request Confirmation</h2>
                    <p>Dear Bhojan User,</p>
                    <p>This email confirms a data privacy event for your account. Details of the action are listed below:</p>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin: 20px 0; font-size: 14px; color: #475569;">
                        <strong>Request Details:</strong>
                        <ul style="margin: 8px 0 0 20px; padding: 0;">
                            <li>Action Type: ${details.type || 'Data Export Request / Cookie Consent'}</li>
                            <li>Status: ${details.status || 'Successfully Executed'}</li>
                            <li>Processed Timestamp: ${new Date().toLocaleString()}</li>
                        </ul>
                    </div>

                    <p>Bhojan is GDPR compliant. If you did not trigger this request, please contact our Data Protection Officer immediately.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2026 Bhojan Privacy. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `
};

module.exports = emailTemplates;
