import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-1">
                        <h2 className="text-2xl font-bold text-primary mb-4">Bhojan</h2>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Mithilanchal's #1 Food Delivery Platform. Connecting local tastes with modern speed.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-gray-900 font-bold mb-4 uppercase text-xs tracking-wider">Resources</h3>
                        <ul className="space-y-3">
                            <li><Link to="/" className="text-gray-500 hover:text-primary transition-colors text-sm">Home</Link></li>
                            <li><Link to="/profile" className="text-gray-500 hover:text-primary transition-colors text-sm">My Account</Link></li>
                            <li><Link to="/cart" className="text-gray-500 hover:text-primary transition-colors text-sm">View Cart</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-gray-900 font-bold mb-4 uppercase text-xs tracking-wider">Legal</h3>
                        <ul className="space-y-3">
                            <li><Link to="/terms" className="text-gray-500 hover:text-primary transition-colors text-sm">Terms of Service</Link></li>
                            <li><Link to="/privacy" className="text-gray-500 hover:text-primary transition-colors text-sm">Privacy Policy</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-gray-900 font-bold mb-4 uppercase text-xs tracking-wider">Support</h3>
                        <ul className="space-y-3">
                            <li className="text-gray-500 text-sm">Darbhanga, Bihar, India</li>
                            <li className="text-gray-500 text-sm">support@bhojan.in</li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-50 pt-8 flex flex-col md:row items-center justify-between gap-4">
                    <p className="text-gray-400 text-xs text-center">
                        © 2026 Bhojan Delivery Service. All rights reserved. Made in Darbhanga 💖
                    </p>
                    <div className="flex gap-6">
                        <span className="text-gray-400 hover:text-primary cursor-pointer text-xs">FB</span>
                        <span className="text-gray-400 hover:text-primary cursor-pointer text-xs">IG</span>
                        <span className="text-gray-400 hover:text-primary cursor-pointer text-xs">TW</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
