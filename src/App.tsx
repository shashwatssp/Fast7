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
    // Check if user data is in local storage
    const storedUser = localStorage.getItem('user');
    if (storedUser && !user) {
      // If user data is in storage but not in state, set it in state
      // This is a simplified example. In practice, you might want to verify the token
      const userData = JSON.parse(storedUser);
      // You might need to use a different method to set the user in your auth state
      // This depends on how your Firebase setup is configured
    }
  }, [user]);

  useEffect(() => {
    console.log(user);
    // When user state changes, update local storage
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }



  // const subdomain = "shas";
  // console.log("Detected subdomain:", subdomain);

  return (
    <Router>
      <Routes>
        {/* {subdomain ? (
          <Route 
            path="shas" 
            element={<RestaurantPage subdomain={subdomain} />} 
          />
        ) : ( */}
          <>
            <Route path="/" element={user ? <Navigate to="/onboarding" /> : <HomePage />} />
            <Route path="/onboarding" element={user ? <RestaurantOnboarding /> : <Navigate to="/" />} />
            <Route path="/home" element={user ? <HomePage /> : <Navigate to="/" />} />
            <Route path="/:domainPrefix/*" element={<RestaurantPage />} />
          </>
        {/* )} */}
      </Routes>
    </Router>
  );
}

export default App;
