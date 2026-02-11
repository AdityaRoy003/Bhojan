import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    shops: [],
    currentShop: null,
    loading: false,
    error: null,
};

const shopSlice = createSlice({
    name: 'shop',
    initialState,
    reducers: {
        setShops: (state, action) => {
            state.shops = action.payload;
            state.loading = false;
        },
        setCurrentShop: (state, action) => {
            state.currentShop = action.payload;
            state.loading = false;
        },
        setShopLoading: (state, action) => {
            state.loading = action.payload;
        },
        setShopError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        }
    }
});

export const { setShops, setCurrentShop, setShopLoading, setShopError } = shopSlice.actions;
export default shopSlice.reducer;
