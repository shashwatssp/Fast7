import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase'; 
import RestaurantOnboarding from './components/RestaurantOnboarding';
import HomePage from './components/HomePage';
import RestaurantPage from './components/website/RestaurantPage';

function App() {
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && !user) {
      const userData = JSON.parse(storedUser);
      // Set user state logic if needed
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Detect subdomain
  const hostname = window.location.hostname; // e.g., foods.dash.netlify.app
  const subdomain = hostname.split('.')[0]; // Extract 'foods' or the first part of the hostname



  const isSubdomain = subdomain !== "dash" && subdomain !== "www"; // Avoid root domain or common subdomains

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
        {isSubdomain && subdomain!="localhost" && subdomain!="192" ? (
          <Route
            path="/*"
            element={<RestaurantPage subdomain={subdomain} />}
          />
        ) : (
          <>
            <Route path="/" element={user ? <Navigate to="/onboarding" /> : <HomePage />} />
            <Route path="/onboarding" element={user ? <RestaurantOnboarding /> : <Navigate to="/" />} />
            <Route path="/home" element={user ? <HomePage /> : <Navigate to="/" />} />
            <Route path="/*" element={<RestaurantPage subdomain ={subdomain2 || "foods"} />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
