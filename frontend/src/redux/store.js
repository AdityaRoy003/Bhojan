import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import shopReducer from './shopSlice';
import cartReducer from './cartSlice';
import locationReducer from './locationSlice';

export const store = configureStore({
    reducer: {
        user: userReducer,
        shop: shopReducer,
        cart: cartReducer,
        location: locationReducer,
    },
});
