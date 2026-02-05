import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./UserAuthContext";
import ToastService from "../utils/toastService";

interface ProtectedRouteProps {
  children: React.ReactElement;
}

/**
 * ProtectedRoute component ensures that only authenticated users can access protected routes.
 * If user is not authenticated, redirects to login page.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Give a small delay to allow auth context to initialize
    // This prevents flash of login page when user is already logged in
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login with return URL
  if (!user) {
    ToastService.error("You must be logged in to access this page.");
    return <Navigate to="/user/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected component
  return children;
};

export default ProtectedRoute;
