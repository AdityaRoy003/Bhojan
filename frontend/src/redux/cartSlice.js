import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    cartItems: localStorage.getItem('cartItems') ? JSON.parse(localStorage.getItem('cartItems')) : [],
    // Each item: { _id, name, price, image, quantity, shopId }
    restaurant: localStorage.getItem('cartRestaurant') ? JSON.parse(localStorage.getItem('cartRestaurant')) : null,
    // Store restaurant details to ensure all items are from the same shop
    coupon: localStorage.getItem('cartCoupon') ? JSON.parse(localStorage.getItem('cartCoupon')) : null,
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart: (state, action) => {
            const item = action.payload;

            // Check if cart is empty or item is from the same shop
            if (state.cartItems.length > 0 && state.restaurant && state.restaurant._id !== item.shop._id) {
                // For simplified flow, we'll just alert or replace. 
                // A better UX would be to ask the user. For now, we'll assume the UI handles the warning.
                // Here we will just NOT add and let the UI handle the error state if we were returning one.
                // However, reducers should be pure. Let's allowing replacing for now or just append if we don't enforce strict single-shop.
                // Strict single-shop rule:
                return state;
            }

            // If first item, set restaurant
            if (state.cartItems.length === 0) {
                state.restaurant = item.shop;
            }

            const existItem = state.cartItems.find((x) => x._id === item._id);

            if (existItem) {
                existItem.quantity += 1;
            } else {
                state.cartItems.push({ ...item, quantity: 1, note: '' });
            }

            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
            localStorage.setItem('cartRestaurant', JSON.stringify(state.restaurant));
        },
        removeFromCart: (state, action) => {
            state.cartItems = state.cartItems.filter((x) => x._id !== action.payload);
            if (state.cartItems.length === 0) {
                state.restaurant = null;
                localStorage.removeItem('cartRestaurant');
            }
            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
        },
        updateQuantity: (state, action) => {
            const { id, quantity } = action.payload;
            const item = state.cartItems.find((x) => x._id === id);
            if (item) {
                item.quantity = quantity;
                if (item.quantity <= 0) {
                    state.cartItems = state.cartItems.filter((x) => x._id !== id);
                }
            }
            if (state.cartItems.length === 0) {
                state.restaurant = null;
                localStorage.removeItem('cartRestaurant');
            }
            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
        },
        clearCart: (state) => {
            state.cartItems = [];
            state.restaurant = null;
            localStorage.removeItem('cartItems');
            localStorage.removeItem('cartRestaurant');
        },
        // Force replace cart (for "Start new order" flow)
        replaceCart: (state, action) => {
            const item = action.payload;
            state.cartItems = [{ ...item, quantity: 1, note: '' }];
            state.restaurant = item.shop;
            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
            localStorage.setItem('cartRestaurant', JSON.stringify(state.restaurant));
        },
        reorder: (state, action) => {
            const { items, restaurant } = action.payload;
            state.cartItems = items.map(item => ({ ...item, quantity: item.quantity || 1, note: '' }));
            state.restaurant = restaurant;
            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
            localStorage.setItem('cartRestaurant', JSON.stringify(state.restaurant));
        },
        updateItemNote: (state, action) => {
            const { id, note } = action.payload;
            const item = state.cartItems.find((x) => x._id === id);
            if (item) {
                item.note = note;
                localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
            }
        },
        applyCoupon: (state, action) => {
            state.coupon = action.payload;
            localStorage.setItem('cartCoupon', JSON.stringify(state.coupon));
        },
        removeCoupon: (state) => {
            state.coupon = null;
            localStorage.removeItem('cartCoupon');
        }
    }
});

export const {
    addToCart, removeFromCart, updateQuantity, clearCart,
    replaceCart, reorder, updateItemNote, applyCoupon, removeCoupon
} = cartSlice.actions;
export default cartSlice.reducer;
