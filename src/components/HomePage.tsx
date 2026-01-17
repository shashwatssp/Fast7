import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase';
import './HomePage.css';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../auth/AuthContext';

const HomePage = () => {
    const navigate = useNavigate();
    const { loading } = useAuth();

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user has a restaurant
            const restaurantsCollectionRef = collection(db, 'restaurants');
            const querySnapshot = await getDocs(
                query(restaurantsCollectionRef, where('ownerId', '==', user.uid))
            );

            if (!querySnapshot.empty) {
                console.log("Restaurant found, navigating to manage");
                navigate('/manage');
            } else {
                console.log("No restaurant found, navigating to onboarding");
                navigate('/onboarding');
            }
        } catch (error: any) {
            console.error('Error signing in with Google:', error);
            
            // Handle specific Firebase auth errors
            if (error.code === 'auth/cancelled-popup-request') {
                console.log('Popup was cancelled by user or blocked');
                // Don't show an error for user cancellation
                return;
            } else if (error.code === 'auth/popup-blocked') {
                console.error('Popup was blocked by browser. Please allow popups for this site.');
                alert('Please allow popups for this site to sign in with Google.');
            } else if (error.code === 'auth/popup-closed-by-user') {
                console.log('Popup was closed by user');
                // Don't show an error for user closing popup
                return;
            } else {
                console.error('Authentication error:', error.message);
                alert('Failed to sign in with Google. Please try again.');
            }
        }
    };

    const handleDashboardOpen = () => {
        navigate('/manage');
    };

    if (loading) {
        return (
            <div className="animated-bg">
                <div className="wrapper">
                    <div className="container">
                        <div style={{ height: '20rem' }}></div>
                        <div className="loading-spinner"></div>
                        <p>Loading...</p>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="animated-bg">
            <div className="wrapper">
                <div className="container">
                    {/* Header Section */}
                    <header className="header">
                        <h1 className="logo">
                            Fast7<span className="lightning">⚡</span>
                        </h1>
                    </header>

                    {/* Hero Section */}
                    <main>
                        <div className="hero-card">
                            <h2 className="hero-title">
                                Launch Your Restaurant Online in 7 Minutes
                            </h2>
                            <p className="hero-subtitle">
                                Create a stunning website for your restaurant in under 7 minutes and start taking orders today. No coding required.
                            </p>
                            <button
                                className="primary-button"
                                onClick={handleGoogleSignIn}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" height="1.5rem" viewBox="0 0 48 48">
                                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                                    <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
                                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                                </svg>
                                Continue with Google
                            </button>
                        </div>

                        {/* Spacer div for vertical spacing */}
                        <div className="spacer" style={{ height: '20px' }}></div>

                        {/* Dashboard Access Card - New section */}
                        <div className="hero-card dashboard-card-two">
                            <h2 className="hero-title">
                                Already Onboarded?
                            </h2>
                            <p className="hero-subtitle">
                                If you've already set up your restaurant, access your dashboard to manage orders, update your menu, and more.
                            </p>
                            <button
                                className="second-button"
                                onClick={handleDashboardOpen}
                            >
                                Open Dashboard
                            </button>
                        </div>

                        {/* Features Section - Vertical Layout */}
                        <section className="features-section">
                            <h3 className="features-title">Why Choose Fast7?</h3>

                            <div className="feature-card">
                                <div className="feature-icon">🚀</div>
                                <h3 className="feature-title">Quick Setup</h3>
                                <p className="feature-description">Get your restaurant online in 7 Minutes, not days. Our intuitive interface makes it easy to upload your menu, set prices, and customize your branding without any technical skills.</p>
                            </div>

                            <div className="feature-card">
                                <div className="feature-icon">📱</div>
                                <h3 className="feature-title">Mobile Optimized</h3>
                                <p className="feature-description">Beautiful on all devices, especially mobile where most customers place their orders. Your restaurant website will look professional and work flawlessly on smartphones, tablets, and desktops.</p>
                            </div>

                            <div className="feature-card">
                                <div className="feature-icon">💰</div>
                                <h3 className="feature-title">Boost Revenue</h3>
                                <p className="feature-description">Start accepting online orders instantly with zero commission fees. Increase your average order value with smart upselling features and build customer loyalty with a seamless ordering experience.</p>
                            </div>
                        </section>

                        {/* Call to Action Section */}
                        <section className="cta-section">
                            <p className="cta-text">Ready to grow your restaurant business?</p>
                            <button className="third-button" onClick={handleGoogleSignIn}>
                                Get Started Now
                            </button>
                        </section>
                    </main>

                    {/* Footer Section */}
                    <footer className="footer">
                        <p>&copy; {new Date().getFullYear()} Fast7. All rights reserved.</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
