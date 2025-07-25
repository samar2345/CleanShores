import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux'; // Redux hook to access global state

/**
 * AuthLayout component for protecting routes.
 * It renders its children only if authentication/authorization checks pass.
 * Shows a loader while checks are in progress.
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The child components (pages) to render if authorized.
 * @param {boolean} [props.authentication=true] - Determines authentication requirement:
 * - If `true`: The route requires the user to be authenticated. Redirects to `/login` if not.
 * - If `false`: The route does NOT require authentication (public route, like login/signup). Redirects to `/dashboard` if user *is* already authenticated.
 * @param {string[]} [props.allowedRoles=[]] - An array of roles (e.g., ['admin', 'ngo']) that are permitted to access the route. Empty array means any authenticated user.
 * - If empty: Any authenticated user is allowed.
 * - If non-empty: User's role must be in this array.
 */
const AuthLayout = ({ children, authentication = true, allowedRoles = [] }) => {
    const navigate = useNavigate();
    // Select authentication status, user data, and global loading state from the Redux store.
    const authStatus = useSelector((state) => state.auth.authStatus);
    const user = useSelector((state) => state.auth.userData);
    const isLoading = useSelector((state) => state.auth.isLoading); // Global loading flag for initial app auth check.

    const [loader, setLoader] = useState(true); // Local loader state to manage rendering until auth check is done.

    useEffect(() => {
        // Step 1: Wait until the global authentication check (in App.jsx's useEffect) is complete.
        if (isLoading) {
            setLoader(true); // Keep loader true while global check is ongoing.
            return; // Exit useEffect early, re-run when isLoading changes.
        }

        // Step 2: Perform Redirection Logic based on authentication status and roles.

        // Scenario 1: Route requires authentication (`authentication=true`), but user is NOT authenticated.
        // (e.g., User tries to access `/dashboard` without being logged in)
        if (authentication && !authStatus) {
            navigate("/login"); // Redirect to the login page.
        } 
        // Scenario 2: Route does NOT require authentication (`authentication=false`), but user IS authenticated.
        // Only redirect if user tries to access login or signup pages while authenticated.
        else if (!authentication && authStatus) {
            const currentPath = window.location.pathname;
            const isAuthPage = currentPath === '/login' || currentPath.startsWith('/signup');
            if (isAuthPage) {
                // Redirect based on user's role if possible, otherwise default dashboard
                if (user?.role === 'ngo') {
                    navigate("/ngo/dashboard");
                } else if (user?.role === 'admin' && user?.status === 'active') {
                    navigate("/admin/dashboard");
                } else {
                    navigate("/dashboard");
                }
            }
        }
        // Scenario 3: Route requires authentication (`authentication=true`) AND user IS authenticated, now check roles.
        // (e.g., An admin tries to access an NGO-only page)
        else if (authentication && authStatus) {
            // If specific `allowedRoles` are defined for this route AND
            // there is a `user` object AND the user's role is NOT in the `allowedRoles` list.
            if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
                navigate("/"); // Redirect to the home page (or a more specific 403 Forbidden page).
            }
            // If roles are not specified (allowedRoles is empty), or if the user's role is allowed,
            // execution proceeds to render children.
        }
        
        // Step 3: If none of the above redirection conditions were met, it means authentication/authorization passed.
        setLoader(false); // Hide the loader and render children.

    }, [authStatus, navigate, authentication, user, allowedRoles, isLoading]); // Dependencies for useEffect.

    // Render a loading spinner or message while authentication status is being determined.
    return loader ? (
        <div className="flex justify-center items-center min-h-screen text-4xl text-blue-600">
            Loading authentication...
        </div>
    ) : (
        // Render child components (`children`) once authentication check is complete and passed.
        <>{children}</>
    );
};

export default AuthLayout;