// client/src/App.jsx
import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom'; // `Outlet` is used for rendering nested routes
import Header from './components/common/Header.jsx';
import Footer from './components/common/Footer.jsx';
import { useSelector, useDispatch } from 'react-redux'; // Redux hooks to interact with the store
import { login, logout, setLoading } from './store/authSlice.js'; // Action creators for auth state
import authService from './api/auth.js'; // API service for authentication

function App() {
  const dispatch = useDispatch(); // Hook to dispatch actions
  const isLoading = useSelector((state) => state.auth.isLoading); // Select the global loading state from Redux

  // `useEffect` hook to perform side effects (like data fetching) after render.
  // This runs once when the component mounts (due to empty dependency array `[dispatch]`).
  useEffect(() => {
    /**
     * Checks the current authentication status by calling the backend API.
     * Dispatches Redux actions to update the global auth state.
     */
    const checkAuthStatus = async () => {
      try {
        // Attempt to get current user data from the backend using stored token.
        const userData = await authService.getCurrentUser();
        if (userData) {
          // If user data is successfully retrieved, dispatch the `login` action.
          // Corrected: Pass userData directly as payload
          dispatch(login(userData)); // <-- MODIFIED LINE
        } else {
          // If no user data, dispatch the `logout` action to ensure logged-out state.
          dispatch(logout());
        }
      } catch (error) {
        // Log any errors during authentication check and ensure user is logged out.
        console.error("Error checking auth status:", error);
        dispatch(logout());
      } finally {
        // Regardless of success or failure, set `isLoading` to false after the check.
        dispatch(setLoading(false));
      }
    };

    checkAuthStatus(); // Call the authentication check function.
  }, [dispatch]); // Dependency array: useEffect runs when `dispatch` changes (effectively once on mount).

  return (
    <>
      {/* Conditionally render the app content or a loading indicator based on `isLoading` state. */}
      {!isLoading ? (
        <div className="flex flex-col min-h-screen"> {/* Flex column layout to push footer down */}
          <Header /> {/* Renders the navigation header */}
          <main className="flex-grow"> {/* Main content area that expands */}
            <Outlet /> {/* Renders the component matched by the current route */}
          </main>
          <Footer /> {/* Renders the application footer */}
        </div>
      ) : (
        <div className="flex justify-center items-center min-h-screen text-4xl text-blue-600">
          Loading app... {/* Loading indicator while auth status is being checked */}
        </div>
      )}
    </>
  );
}

export default App;