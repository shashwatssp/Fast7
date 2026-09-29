import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase';
import './HomePage.css';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../auth/AuthContext';
import {
  Zap,
  Rocket,
  Smartphone,
  IndianRupee,
  Palette,
  ArrowRight,
  LayoutDashboard,
} from 'lucide-react';

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
      <div className="home-loading">
        <div className="loading-spinner" />
        <p>Warming things up...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Top navigation */}
      <header className="home-nav">
        <div className="home-nav-inner">
          <span className="home-logo">
            <span className="home-logo-mark"><Zap size={18} strokeWidth={2.5} /></span>
            Fast7
          </span>
          <nav className="home-nav-actions">
            <button className="home-nav-link" onClick={handleDashboardOpen}>
              <LayoutDashboard size={16} /> Open Dashboard
            </button>
            <button className="home-google-btn" onClick={handleGoogleSignIn}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
              </svg>
              Sign in with Google
            </button>
          </nav>
        </div>
      </header>

      <main className="home-main">
        {/* Hero */}
        <section className="home-hero">
          <div className="home-hero-copy">
            <span className="home-hero-badge"><Rocket size={14} /> Built for restaurant owners</span>
            <h1>Launch Your Restaurant Online in <em>7 Minutes</em></h1>
            <p className="home-hero-sub">
              Create a stunning website for your restaurant in under 7 minutes and start
              taking orders today. No coding required — pick a template, add your menu, go live.
            </p>
            <div className="home-hero-actions">
              <button className="home-google-btn home-google-btn--lg" onClick={handleGoogleSignIn}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                  <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                </svg>
                Continue with Google
              </button>
              <button className="home-ghost-btn" onClick={handleDashboardOpen}>
                Open Dashboard <ArrowRight size={17} />
              </button>
            </div>
            <ul className="home-hero-points">
              <li><Zap size={15} /> 7-minute setup</li>
              <li><IndianRupee size={15} /> Zero commission</li>
              <li><Palette size={15} /> 6 designer templates</li>
            </ul>
          </div>

          {/* Decorative storefront mock */}
          <div className="home-hero-visual" aria-hidden="true">
            <div className="home-mock">
              <div className="home-mock-bar">
                <span /><span /><span />
              </div>
              <div className="home-mock-hero">
                <span className="home-mock-pill" />
                <span className="home-mock-title" />
                <span className="home-mock-line" />
                <span className="home-mock-cta" />
              </div>
              <div className="home-mock-grid">
                <div className="home-mock-card"><span className="home-mock-img" /><span className="home-mock-line home-mock-line--short" /><span className="home-mock-chip" /></div>
                <div className="home-mock-card"><span className="home-mock-img" /><span className="home-mock-line home-mock-line--short" /><span className="home-mock-chip" /></div>
                <div className="home-mock-card"><span className="home-mock-img" /><span className="home-mock-line home-mock-line--short" /><span className="home-mock-chip" /></div>
              </div>
            </div>
          </div>
        </section>

        {/* Already onboarded */}
        <section className="home-returning">
          <div>
            <h2>Already onboarded?</h2>
            <p>Access your dashboard to manage orders, update your menu, and track revenue.</p>
          </div>
          <button className="home-ghost-btn" onClick={handleDashboardOpen}>
            Open Dashboard <ArrowRight size={17} />
          </button>
        </section>

        {/* Features */}
        <section className="home-features">
          <p className="home-eyebrow">Why Fast7</p>
          <h2 className="home-section-title">Everything you need to sell online</h2>
          <div className="home-features-grid">
            <article className="home-feature-card">
              <div className="home-feature-icon"><Rocket size={22} /></div>
              <h3>Quick Setup</h3>
              <p>Get your restaurant online in minutes, not days. Upload your menu, set prices, and customize your branding — no technical skills needed.</p>
            </article>
            <article className="home-feature-card">
              <div className="home-feature-icon"><Smartphone size={22} /></div>
              <h3>Mobile Optimized</h3>
              <p>Beautiful on every device, especially mobile where most customers order. Your website looks professional and works flawlessly everywhere.</p>
            </article>
            <article className="home-feature-card">
              <div className="home-feature-icon"><IndianRupee size={22} /></div>
              <h3>Boost Revenue</h3>
              <p>Accept online orders instantly with zero commission fees. Grow your average order value and build customer loyalty with seamless ordering.</p>
            </article>
          </div>
        </section>

        {/* Templates strip */}
        <section className="home-templates">
          <div className="home-templates-copy">
            <p className="home-eyebrow">Designer templates</p>
            <h2 className="home-section-title">Pick a look your food deserves</h2>
            <p className="home-templates-sub">
              Six hand-crafted, fully responsive website themes with live preview.
              Switch anytime from your dashboard.
            </p>
            <button
              className="home-gradient-btn"
              onClick={() => navigate('/templates')}
            >
              Browse Templates <ArrowRight size={17} />
            </button>
          </div>
          <div className="home-swatches" aria-hidden="true">
            <span style={{ background: 'linear-gradient(135deg,#ff7a3d,#d42b22)' }} />
            <span style={{ background: 'linear-gradient(135deg,#4ade80,#15803d)' }} />
            <span style={{ background: 'linear-gradient(135deg,#f0c96c,#1a130e)' }} />
            <span style={{ background: 'linear-gradient(135deg,#38bdf8,#0369a1)' }} />
            <span style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }} />
            <span style={{ background: 'linear-gradient(135deg,#f59e0b,#ea580c)' }} />
          </div>
        </section>

        {/* CTA */}
        <section className="home-cta">
          <h2>Ready to grow your restaurant business?</h2>
          <p>Join Fast7 today and start taking orders from your own website.</p>
          <button className="home-cta-btn" onClick={handleGoogleSignIn}>
            Get Started Now — It's Free
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <p>&copy; {new Date().getFullYear()} Fast7. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;
