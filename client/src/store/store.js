import { configureStore } from '@reduxjs/toolkit';
import authSlice from './authSlice'; // Import the authentication slice reducer

const store = configureStore({
    reducer: {
        // Define your reducers here. Each key will be a slice of your Redux state.
        auth: authSlice, // The 'auth' slice will manage authentication-related state.
        // You can add other slices here as your application grows (e.g., events: eventSlice.reducer, products: productSlice.reducer)
    },
});

export default store;