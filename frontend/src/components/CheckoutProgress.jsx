import React from 'react';
import { motion } from 'framer-motion';

const CheckoutProgress = ({ currentStep }) => {
    const steps = [
        { id: 1, label: 'Cart' },
        { id: 2, label: 'Address' },
        { id: 3, label: 'Payment' }
    ];

    return (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800/80 py-6 mb-8 px-4 transition-colors duration-300">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
                {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                        <div className={`flex flex-col items-center gap-2 flex-1 transition-opacity duration-300 ${currentStep < step.id ? 'opacity-80' : 'opacity-100'}`}>
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: currentStep === step.id ? 1.1 : 1,
                                    backgroundColor: currentStep >= step.id ? 'var(--primary, #e63946)' : '#d1d5db'
                                }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg ${
                                    currentStep >= step.id 
                                        ? 'text-white shadow-red-100 dark:shadow-none' 
                                        : 'text-gray-800 dark:text-gray-200 shadow-none'
                                }`}
                                style={{
                                    backgroundColor: currentStep >= step.id ? undefined : '#d1d5db'
                                }}
                            >
                                {step.id}
                            </motion.div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${currentStep >= step.id ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                                {step.label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className="h-0.5 bg-gray-100 dark:bg-gray-800 flex-1 mx-4">
                                <motion.div
                                    initial={{ width: '0%' }}
                                    animate={{ width: currentStep > step.id ? '100%' : '0%' }}
                                    className="h-full bg-primary"
                                />
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default CheckoutProgress;

