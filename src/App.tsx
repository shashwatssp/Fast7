import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import RestaurantOnboarding from './components/RestaurantOnboarding';
import HomePage from './components/HomePage';
import RestaurantPage from './components/website/RestaurantPage';
import { AuthProvider, useAuth } from './auth/AuthContext';
import RestaurantManagement from './components/manage/RestaurantManagement';
import EditMenuComponent from './components/manage/EditMenuComponent';
import OrderTracking from './components/customer/OrderTracking';
import OrderTrackingDemo from './components/customer/OrderTrackingDemo';
import DashboardPage from './components/manage/pages/DashboardPage';
import OrdersPage from './components/manage/pages/OrdersPage';
import MenuPage from './components/manage/pages/MenuPage';
import SettingsPage from './components/manage/pages/SettingsPage';

// AppRoutes component that uses the auth context
const AppRoutes: React.FC = () => {
  const { currentUser, loading } = useAuth();

  // Detect subdomain
  const hostname = window.location.hostname; // e.g., foods.Fast7.netlify.app
  const subdomain = hostname.split('.')[0]; // Extract 'foods' or the first part of the hostname

  if (loading) {
    return (
      <div>
        <div style={{ height: '20rem' }}></div>
        <div className="loading-spinner"></div>
        <p>Loading...</p>
        <div style={{ height: '200rem' }}></div>
      </div>
    );
  }

  const isSubdomain = subdomain !== "fast7" && subdomain !== "www" && subdomain !== "manage"; // Avoid root domain or common subdomains

  console.log("Detected subdomain:", subdomain);

  const getSubdomainFromPath = () => {
    const pathname = window.location.pathname; // e.g., "/foods"
    const parts = pathname.split('/');
    return parts.length > 1 ? parts[1] : null; // Return 'foods', or null if the path is empty
  };

  // Call the function to get the subdomain
  const subdomain2 = getSubdomainFromPath();

  return (
    <Router>
      <Routes>
        <Route
          path="/manage"
          element={currentUser ? <RestaurantManagement /> : <Navigate to="/" replace />}
        />
        <Route
          path="/manage/dashboard"
          element={currentUser ? <DashboardPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/manage/orders"
          element={currentUser ? <OrdersPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/manage/menu"
          element={currentUser ? <MenuPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/manage/settings"
          element={currentUser ? <SettingsPage /> : <Navigate to="/" replace />}
        />
        {isSubdomain && subdomain !== "localhost" && subdomain !== "192" && subdomain !== "Fast7" ? (
          <Route
            path="/*"
            element={<RestaurantPage subdomain={subdomain} />}
          />
        ) : (
          <>
            <Route 
              path="/" 
              element={currentUser ? <Navigate to="/manage" replace /> : <HomePage />} 
            />
            <Route 
              path="/onboarding" 
              element={currentUser ? <RestaurantOnboarding /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/home" 
              element={currentUser ? <Navigate to="/manage" replace /> : <Navigate to="/" replace />} 
            />
            <Route
              path="/track/:orderId"
              element={<OrderTracking />}
            />
            <Route
              path="/tracking-demo"
              element={<OrderTrackingDemo />}
            />
            <Route
              path="/*"
              element={<RestaurantPage subdomain={subdomain2 || "foods"} />}
            />
          </>
        )}
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
