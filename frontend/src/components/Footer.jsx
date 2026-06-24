import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (email) {
            setSubscribed(true);
            setEmail('');
            setTimeout(() => setSubscribed(false), 4000);
        }
    };

    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pt-16 pb-28 md:pb-8 transition-colors">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">

                {/* Top Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-8 mb-14">

                    {/* Brand Column */}
                    <div className="md:col-span-2 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-100">
                                <span className="text-white text-lg font-black">B</span>
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Bhojan</h2>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs">
                            Mithilanchal's #1 Food Delivery Platform. Connecting local authentic flavors with priority delivery speeds across Darbhanga & beyond.
                        </p>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[10px] font-black px-3 py-1.5 rounded-full border border-green-100 dark:border-green-900">
                                ✅ FSSAI Compliant
                            </span>
                            <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[10px] font-black px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-900">
                                🔒 Secure Payments
                            </span>
                            <span className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-black px-3 py-1.5 rounded-full border border-amber-100 dark:border-amber-900">
                                ⚡ 30-Min Delivery
                            </span>
                        </div>

                        {/* Newsletter */}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Subscribe for offers & updates</p>
                            {subscribed ? (
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-bold">
                                    <span>✅</span> You're subscribed! Tasty deals incoming.
                                </div>
                            ) : (
                                <form onSubmit={handleSubscribe} className="flex gap-2">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-primary text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition shadow-lg shadow-red-100"
                                    >
                                        Join
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-gray-900 dark:text-gray-100 font-black mb-5 uppercase text-[10px] tracking-[0.2em]">Company</h3>
                        <ul className="space-y-3">
                            <li><a href="#about" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">About Bhojan</a></li>
                            <li><a href="#newsroom" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Newsroom</a></li>
                            <li>
                                <a href="https://adityaportfollio.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">
                                    Developer Portfolio
                                </a>
                            </li>
                            <li>
                                <a href="https://github.com/AdityaRoy003" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">
                                    GitHub
                                </a>
                            </li>
                            <li>
                                <a href="https://www.linkedin.com/in/aditya-kumar-roy-667824316" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">
                                    LinkedIn
                                </a>
                            </li>
                            <li><Link to="/partner" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Partner With Us</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-gray-900 dark:text-gray-100 font-black mb-5 uppercase text-[10px] tracking-[0.2em]">Support & Help</h3>
                        <ul className="space-y-3">
                            <li><Link to="/profile?tab=support" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Help Center</Link></li>
                            <li><Link to="/profile?tab=support" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Support Ticket Desk</Link></li>
                            <li><Link to="/profile?tab=orders" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Track My Order</Link></li>
                            <li><Link to="/profile?tab=payments" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Refund Status</Link></li>
                            <li>
                                <a href="mailto:support@bhojan.in" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium flex items-center gap-1.5">
                                    <span>✉️</span> support@bhojan.in
                                </a>
                            </li>
                            <li>
                                <a href="tel:+911234567890" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium flex items-center gap-1.5">
                                    <span>📞</span> +91 12345 67890
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-gray-900 dark:text-gray-100 font-black mb-5 uppercase text-[10px] tracking-[0.2em]">Legal Policies</h3>
                        <ul className="space-y-3">
                            <li><Link to="/terms" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Terms of Service</Link></li>
                            <li><Link to="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Privacy Policy</Link></li>
                            <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Cookie Policy</a></li>
                            <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Safety Protocols</a></li>
                            <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Anti-Spam Guidelines</a></li>
                            <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Grievance Redressal</a></li>
                        </ul>
                    </div>
                </div>

                {/* App Download Row */}
                <div className="bg-gradient-to-r from-gray-50 to-orange-50 dark:from-gray-800 dark:to-gray-800 rounded-3xl p-6 mb-10 flex flex-col md:flex-row items-center justify-between gap-4 border border-gray-100 dark:border-gray-700">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Available On</p>
                        <h4 className="text-lg font-black text-gray-900 dark:text-white">Get the Bhojan App</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Faster ordering, live tracking & exclusive in-app deals</p>
                    </div>
                    <div className="flex gap-3">
                        <a href="#" className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-2xl text-xs font-black hover:bg-gray-800 transition shadow-md">
                            <span className="text-xl">🍎</span>
                            <div>
                                <p className="text-[8px] font-bold opacity-60 uppercase">Download on</p>
                                <p className="text-sm font-black">App Store</p>
                            </div>
                        </a>
                        <a href="#" className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-2xl text-xs font-black hover:bg-red-600 transition shadow-md">
                            <span className="text-xl">▶</span>
                            <div>
                                <p className="text-[8px] font-bold opacity-60 uppercase">Get it on</p>
                                <p className="text-sm font-black">Google Play</p>
                            </div>
                        </a>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-4 text-center">
                        <p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                            © {currentYear} Bhojan Technologies Pvt. Ltd.
                        </p>
                        <span className="hidden md:block text-gray-200 dark:text-gray-700">|</span>
                        <p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold">
                            Made with 💖 in Darbhanga, Bihar, India
                        </p>
                    </div>

                    {/* Social Icons */}
                    <div className="flex gap-3">
                        <a
                            href="https://facebook.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 bg-gray-100 dark:bg-gray-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 text-sm font-black"
                            title="Facebook"
                        >
                            f
                        </a>
                        <a
                            href="https://instagram.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 bg-gray-100 dark:bg-gray-800 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 hover:text-white dark:hover:bg-pink-600 text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 text-lg"
                            title="Instagram"
                        >
                            📸
                        </a>
                        <a
                            href="https://twitter.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 bg-gray-100 dark:bg-gray-800 hover:bg-black hover:text-white dark:hover:bg-black text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 text-sm font-black"
                            title="X (Twitter)"
                        >
                            𝕏
                        </a>
                        <a
                            href="https://www.linkedin.com/in/aditya-kumar-roy-667824316"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 bg-gray-100 dark:bg-gray-800 hover:bg-blue-700 hover:text-white dark:hover:bg-blue-700 text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 text-xs font-black"
                            title="LinkedIn"
                        >
                            in
                        </a>
                        <a
                            href="https://github.com/AdityaRoy003"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 bg-gray-100 dark:bg-gray-800 hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 text-sm"
                            title="GitHub"
                        >
                            ⌥
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
