// 🥗 FitBhojan AI Nutritional & Macronutrient Estimation Engine

// Calorie & Macro heuristics based on common Indian & Global dish keywords
const MACRO_HEURISTICS = [
    { keywords: ['biryani', 'pulao', 'fried rice'], calories: 550, protein: 22, carbs: 68, fats: 18 },
    { keywords: ['paneer', 'cottage cheese'], calories: 420, protein: 20, carbs: 24, fats: 26 },
    { keywords: ['chicken', 'murgh'], calories: 480, protein: 38, carbs: 14, fats: 22 },
    { keywords: ['mutton', 'lamb', 'gosht'], calories: 620, protein: 34, carbs: 12, fats: 36 },
    { keywords: ['fish', 'prawn', 'seafood'], calories: 380, protein: 32, carbs: 16, fats: 14 },
    { keywords: ['dal', 'lentil', 'rajma', 'chole'], calories: 320, protein: 16, carbs: 46, fats: 8 },
    { keywords: ['roti', 'chapati', 'naan', 'paratha'], calories: 240, protein: 6, carbs: 42, fats: 6 },
    { keywords: ['pizza', 'calzone'], calories: 680, protein: 24, carbs: 74, fats: 30 },
    { keywords: ['burger', 'sandwich'], calories: 520, protein: 22, carbs: 54, fats: 24 },
    { keywords: ['salad', 'sprouts', 'soup'], calories: 180, protein: 8, carbs: 22, fats: 4 },
    { keywords: ['dosa', 'idli', 'uttapam'], calories: 280, protein: 7, carbs: 52, fats: 6 },
    { keywords: ['pasta', 'noodle', 'maggi'], calories: 460, protein: 14, carbs: 64, fats: 16 },
    { keywords: ['dessert', 'halwa', 'gulab jamun', 'brownie', 'ice cream'], calories: 380, protein: 5, carbs: 58, fats: 16 },
    { keywords: ['shake', 'smoothie', 'lassi'], calories: 290, protein: 8, carbs: 44, fats: 9 },
    { keywords: ['tea', 'coffee', 'chai'], calories: 90, protein: 3, carbs: 12, fats: 3 },
];

export const estimateNutrition = (dish) => {
    if (!dish) return { calories: 350, protein: 12, carbs: 45, fats: 10 };

    // If dish already has explicit nutritional specs
    if (dish.nutrition) {
        return {
            calories: dish.nutrition.calories || 350,
            protein: dish.nutrition.protein || 12,
            carbs: dish.nutrition.carbs || 45,
            fats: dish.nutrition.fats || 10
        };
    }

    const name = (dish.name || '').toLowerCase();
    const category = (dish.category || '').toLowerCase();
    const tags = Array.isArray(dish.dietaryTags) ? dish.dietaryTags.join(' ').toLowerCase() : '';
    const text = `${name} ${category} ${tags}`;

    // Find best heuristic match
    let match = MACRO_HEURISTICS.find(h => h.keywords.some(k => text.includes(k)));

    if (!match) {
        // Fallback based on food type
        if (dish.foodType === 'Non-Veg') {
            match = { calories: 480, protein: 30, carbs: 30, fats: 20 };
        } else if (dish.foodType === 'Vegan') {
            match = { calories: 310, protein: 11, carbs: 50, fats: 7 };
        } else {
            match = { calories: 360, protein: 14, carbs: 48, fats: 12 };
        }
    }

    // Scale slightly by price (larger/richer dishes typically cost more)
    const priceFactor = dish.price > 350 ? 1.15 : dish.price < 150 ? 0.85 : 1.0;

    return {
        calories: Math.round(match.calories * priceFactor),
        protein: Math.round(match.protein * priceFactor),
        carbs: Math.round(match.carbs * priceFactor),
        fats: Math.round(match.fats * priceFactor)
    };
};

export const calculateCartNutrition = (cartItems = []) => {
    return cartItems.reduce(
        (totals, item) => {
            const qty = item.quantity || 1;
            const itemMacro = estimateNutrition(item);
            return {
                calories: totals.calories + itemMacro.calories * qty,
                protein: totals.protein + itemMacro.protein * qty,
                carbs: totals.carbs + itemMacro.carbs * qty,
                fats: totals.fats + itemMacro.fats * qty
            };
        },
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
};

