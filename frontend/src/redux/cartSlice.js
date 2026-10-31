import { createSlice } from '@reduxjs/toolkit';

const getItemUniqueKey = (item) => {
    if (item.cartItemId) return item.cartItemId;
    const variantKey = item.selectedVariant ? `_var_${item.selectedVariant.option}` : '';
    const addOnKey = item.selectedAddOns && item.selectedAddOns.length > 0
        ? `_addons_${item.selectedAddOns.map(a => a.name).sort().join('-')}`
        : '';
    return `${item._id}${variantKey}${addOnKey}`;
};

const initialState = {
    cartItems: localStorage.getItem('cartItems') ? JSON.parse(localStorage.getItem('cartItems')) : [],
    restaurant: localStorage.getItem('cartRestaurant') ? JSON.parse(localStorage.getItem('cartRestaurant')) : null,
    coupon: localStorage.getItem('cartCoupon') ? JSON.parse(localStorage.getItem('cartCoupon')) : null,
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart: (state, action) => {
            const item = action.payload;

            // Check if cart is empty or item is from the same shop
            if (state.cartItems.length > 0 && state.restaurant && item.shop && state.restaurant._id !== item.shop._id) {
                return state;
            }

            // If first item, set restaurant
            if (state.cartItems.length === 0 && item.shop) {
                state.restaurant = item.shop;
            }

            const itemKey = getItemUniqueKey(item);
            const existItem = state.cartItems.find((x) => (x.cartItemId || getItemUniqueKey(x)) === itemKey);

            if (existItem) {
                existItem.quantity += (item.quantity || 1);
            } else {
                state.cartItems.push({
                    ...item,
                    cartItemId: itemKey,
                    quantity: item.quantity || 1,
                    note: item.note || ''
                });
            }

            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
            localStorage.setItem('cartRestaurant', JSON.stringify(state.restaurant));
        },
        removeFromCart: (state, action) => {
            const idToRemove = action.payload;
            state.cartItems = state.cartItems.filter((x) => (x.cartItemId || x._id) !== idToRemove && x._id !== idToRemove);
            if (state.cartItems.length === 0) {
                state.restaurant = null;
                localStorage.removeItem('cartRestaurant');
            }
            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
        },
        updateQuantity: (state, action) => {
            const { id, quantity } = action.payload;
            const item = state.cartItems.find((x) => (x.cartItemId || x._id) === id || x._id === id);
            if (item) {
                item.quantity = quantity;
                if (item.quantity <= 0) {
                    state.cartItems = state.cartItems.filter((x) => (x.cartItemId || x._id) !== id && x._id !== id);
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
            state.coupon = null;
            localStorage.removeItem('cartItems');
            localStorage.removeItem('cartRestaurant');
            localStorage.removeItem('cartCoupon');
        },
        // Force replace cart (for "Start new order" flow)
        replaceCart: (state, action) => {
            const item = action.payload;
            const itemKey = getItemUniqueKey(item);
            state.cartItems = [{ ...item, cartItemId: itemKey, quantity: item.quantity || 1, note: '' }];
            state.restaurant = item.shop;
            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
            localStorage.setItem('cartRestaurant', JSON.stringify(state.restaurant));
        },
        reorder: (state, action) => {
            const { items, restaurant } = action.payload;
            state.cartItems = items.map(item => {
                const itemKey = getItemUniqueKey(item);
                return { ...item, cartItemId: itemKey, quantity: item.quantity || 1, note: item.note || '' };
            });
            state.restaurant = restaurant;
            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
            localStorage.setItem('cartRestaurant', JSON.stringify(state.restaurant));
        },
        updateItemNote: (state, action) => {
            const { id, note } = action.payload;
            const item = state.cartItems.find((x) => (x.cartItemId || x._id) === id || x._id === id);
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
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    replaceCart,
    reorder,
    updateItemNote,
    applyCoupon,
    removeCoupon
} = cartSlice.actions;

export default cartSlice.reducer;
