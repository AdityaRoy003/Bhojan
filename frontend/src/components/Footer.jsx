import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pt-12 md:pt-16 pb-24 md:pb-8 transition-colors">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 mb-12 text-center md:text-left">
                    {/* Brand Section */}
                    <div className="col-span-1">
                        <h2 className="text-2xl font-black text-primary mb-4 tracking-tighter">Bhojan</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs mx-auto md:mx-0">
                            Mithilanchal's #1 Food Delivery Platform. Connecting local tastes with modern speed.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-gray-900 dark:text-gray-100 font-black mb-5 uppercase text-[10px] tracking-[0.2em]">Resources</h3>
                        <ul className="space-y-3">
                            <li><Link to="/" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Home Feed</Link></li>
                            <li><Link to="/profile" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">My Account</Link></li>
                            <li><Link to="/cart" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">View Cart</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-gray-900 dark:text-gray-100 font-black mb-5 uppercase text-[10px] tracking-[0.2em]">Legal</h3>
                        <ul className="space-y-3">
                            <li><Link to="/terms" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Terms of Service</Link></li>
                            <li><Link to="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors text-sm font-medium">Privacy Policy</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-gray-900 dark:text-gray-100 font-black mb-5 uppercase text-[10px] tracking-[0.2em]">Support</h3>
                        <ul className="space-y-3">
                            <li className="text-gray-500 dark:text-gray-400 text-sm font-medium">Darbhanga, Bihar, India</li>
                            <li className="text-gray-500 dark:text-gray-400 text-sm font-medium">support@bhojan.in</li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-50 dark:border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold text-center uppercase tracking-widest">
                        © 2026 Bhojan Delivery. Made with 💖 in Darbhanga
                    </p>
                    <div className="flex gap-8">
                        <span className="text-gray-400 dark:text-gray-500 hover:text-primary cursor-pointer text-xs font-black uppercase tracking-widest transition-colors">FB</span>
                        <span className="text-gray-400 dark:text-gray-500 hover:text-primary cursor-pointer text-xs font-black uppercase tracking-widest transition-colors">IG</span>
                        <span className="text-gray-400 dark:text-gray-500 hover:text-primary cursor-pointer text-xs font-black uppercase tracking-widest transition-colors">TW</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
