import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk to detect location
export const detectLocation = createAsyncThunk(
    'location/detectLocation',
    async (_, { rejectWithValue }) => {
        try {
            // 1. Get Coordinates
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const { latitude, longitude } = position.coords;

            // 2. Reverse Geocode (Using OpenStreetMap Nominatim for demo/fallback)
            // Note: In production with high volume, use a paid API like Google Maps or Jio
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );

            const address = response.data.address;
            const city = address.city || address.town || address.village || address.county;
            const state = address.state;

            return {
                latitude,
                longitude,
                city,
                state,
                fullAddress: response.data.display_name
            };

        } catch (error) {
            return rejectWithValue(error.message || "Failed to detect location");
        }
    }
);

const initialState = {
    city: null, // "Mumbai", "Delhi" etc.
    state: null,
    address: null,
    latitude: null,
    longitude: null,
    loading: false,
    error: null,
};

const locationSlice = createSlice({
    name: 'location',
    initialState,
    reducers: {
        setManualLocation: (state, action) => {
            state.city = action.payload.city;
            state.state = action.payload.state;
        },
        clearLocation: (state) => {
            state.city = null;
            state.state = null;
            state.address = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(detectLocation.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(detectLocation.fulfilled, (state, action) => {
                state.loading = false;
                state.latitude = action.payload.latitude;
                state.longitude = action.payload.longitude;
                state.city = action.payload.city;
                state.state = action.payload.state;
                state.address = action.payload.fullAddress;
            })
            .addCase(detectLocation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { setManualLocation, clearLocation } = locationSlice.actions;
export default locationSlice.reducer;
