import React from 'react';
import { calculateCartNutrition, estimateNutrition } from '../utils/nutrition';

const FitBhojanMacroWidget = ({ items, singleDish, compact = false }) => {
    const nutrition = singleDish
        ? estimateNutrition(singleDish)
        : calculateCartNutrition(items || []);

    const isHighProtein = nutrition.protein >= (singleDish ? 25 : 45);
    const isLowCarb = nutrition.carbs <= (singleDish ? 30 : 60);

    return (
        <div className={`bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-300/40 dark:border-emerald-700/40 rounded-3xl p-4 transition-all shadow-xs ${compact ? 'text-xs' : ''}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🥗</span>
                    <div>
                        <h4 className="font-black text-xs uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
                            FitBhojan AI Macro Breakdown
                        </h4>
                        <p className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold">
                            Nutritional estimate per serving
                        </p>
                    </div>
                </div>
                <div className="flex gap-1.5">
                    {isHighProtein && (
                        <span className="text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                            High Protein 💪
                        </span>
                    )}
                    {isLowCarb && (
                        <span className="text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-teal-600 text-white shadow-xs">
                            Low Carb 🥑
                        </span>
                    )}
                </div>
            </div>

            {/* 4 Macro Metrics Grid */}
            <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white/80 dark:bg-gray-800/80 p-2.5 rounded-2xl shadow-xs border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">Calories</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">
                        {nutrition.calories} <span className="text-[9px] font-bold text-gray-400">kcal</span>
                    </p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 p-2.5 rounded-2xl shadow-xs border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Protein</p>
                    <p className="text-sm font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                        {nutrition.protein} <span className="text-[9px] font-bold text-gray-400">g</span>
                    </p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 p-2.5 rounded-2xl shadow-xs border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Carbs</p>
                    <p className="text-sm font-black text-amber-700 dark:text-amber-300 mt-0.5">
                        {nutrition.carbs} <span className="text-[9px] font-bold text-gray-400">g</span>
                    </p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 p-2.5 rounded-2xl shadow-xs border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-[9px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Fats</p>
                    <p className="text-sm font-black text-cyan-700 dark:text-cyan-300 mt-0.5">
                        {nutrition.fats} <span className="text-[9px] font-bold text-gray-400">g</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FitBhojanMacroWidget;
