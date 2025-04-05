import React, { useEffect, useState } from 'react';
import './RestaurantOnboarding.css';
import MenuSelectionStep from './MenuSelectionStep';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../auth/AuthContext';

interface MenuSelections {
    standardCategories: (number | string)[];
    standardItems: Record<number | string, (number | string)[]>;
    customCategories: string[];
    customItems: Record<string, string[]>;
}

const RestaurantOnboarding = () => {
    const [orderingEnabled, setOrderingEnabled] = useState(true);
    const { currentUser } = useAuth();
    const [step, setStep] = useState(1);
    const [domainName, setDomainName] = useState('');
    const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [newWebsiteUrl, setNewWebsiteUrl] = useState('');
    const [restaurantInfo, setRestaurantInfo] = useState({
        name: '',
        bio: '',
        phone: '',
        email: '',
        address: ''
    });
    const [menuSelections, setMenuSelections] = useState<MenuSelections>({
        standardCategories: [],
        standardItems: {},
        customCategories: [],
        customItems: {}
    });

    // Check domain availability in Firestore
    const checkDomainAvailability = async (domain: string): Promise<boolean> => {
        if (!domain.trim()) return false;

        const domainPrefix = domain.split('.')[0];
        const docRef = doc(db, 'restaurants', domainPrefix);
        const docSnap = await getDoc(docRef);

        // If document exists, domain is not available
        return !docSnap.exists();
    };

    const handleDomainCheck = async () => {
        if (!domainName.trim()) return;

        setIsChecking(true);
        try {
            const isAvailable = await checkDomainAvailability(domainName);
            setDomainAvailable(isAvailable);
        } catch (error) {
            console.error("Error checking domain availability:", error);
            alert("There was an error checking domain availability. Please try again.");
        } finally {
            setIsChecking(false);
        }
    };

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setRestaurantInfo(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmitInfo = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(3);
    };

    const handleMenuNext = (selections: MenuSelections) => {
        setMenuSelections(selections);
        setStep(4);
    };

    const handleCreateWebsite = async () => {
        try {
            const domainPrefix = domainName.split('.')[0];

            const restaurantData = {
                domainName: domainName,
                ownerId: currentUser?.uid,
                restaurantInfo: {
                    name: restaurantInfo.name,
                    bio: restaurantInfo.bio,
                    phone: restaurantInfo.phone,
                    email: restaurantInfo.email,
                    address: restaurantInfo.address,
                    totalSalesDone: 0,
                },
                menuSelections: {
                    standardCategories: menuSelections.standardCategories,
                    standardItems: menuSelections.standardItems,
                    customCategories: menuSelections.customCategories,
                    customItems: menuSelections.customItems
                },
                orderingEnabled: orderingEnabled,
                createdAt: new Date()
            };

            await setDoc(doc(db, 'restaurants', domainPrefix), restaurantData);

            console.log("Website created successfully with data:", restaurantData);

            // Set website URL and show success popup
            setNewWebsiteUrl(`https://dash69.netlify.app/${domainName}`);
            setShowSuccessPopup(true);

        } catch (error) {
            console.error("Error creating website:", error);
            alert("There was an error creating your website. Please try again.");
        }
    };

    return (
        <div className="onboarding-container">
            {showSuccessPopup && (
                <div className="success-popup-overlay">
                    <div className="success-popup">
                        <div className="success-icon">
                            <svg viewBox="0 0 52 52" className="checkmark">
                                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                            </svg>
                        </div>
                        <h2>Congratulations!</h2>
                        <p>Your website is now live at:</p>
                        <a href={newWebsiteUrl} target="_blank" rel="noopener noreferrer" className="website-url">
                            {newWebsiteUrl}
                        </a>
                        <div className="success-features">
                            <div className="feature-item">
                                <div className="feature-checkbox">✓</div>
                                <p>Website is live</p>
                            </div>
                            <div className="feature-item">
                                <div className="feature-checkbox">✓</div>
                                <p>Online ordering enabled</p>
                            </div>
                            <div className="feature-item">
                                <div className="feature-checkbox">✓</div>
                                <p>Restaurant dashboard ready</p>
                            </div>
                        </div>
                        <button
                            className="visit-website-btn"
                            onClick={() => window.location.href = newWebsiteUrl}
                        >
                            Visit Your Website
                        </button>
                        <button
                            className="go-to-dashboard-btn"
                            onClick={() => window.location.href = 'https://dash69.netlify.app/manage'}
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            )}

            <div className="onboarding-header">
                <h1 className="onboarding-logo">
                    Dash <span className="lightning">⚡</span>
                </h1>
                <div className="progress-indicator">
                    <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
                    <div className="progress-line"></div>
                    <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
                    <div className="progress-line"></div>
                    <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
                    <div className="progress-line"></div>
                    <div className={`progress-step ${step >= 4 ? 'active' : ''}`}>4</div>
                </div>
            </div>

            <div className="onboarding-content">
                {step === 1 && (
                    <div className="onboarding-step domain-step">
                        <h2>Let's create your restaurant website</h2>
                        <p className="step-description">First, choose a unique domain name for your restaurant website.</p>

                        <div className="domain-input-container">
                            <div className="domain-input-wrapper">
                                <input
                                    type="text"
                                    value={domainName}
                                    onChange={(e) => {
                                        setDomainName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                                        setDomainAvailable(null);
                                    }}
                                    placeholder="yourrestaurant"
                                    className="domain-input"
                                />
                                <span className="domain-suffix">.dash.app</span>
                            </div>
                            <button
                                className={`check-domain-btn ${isChecking ? 'checking' : ''}`}
                                onClick={handleDomainCheck}
                                disabled={!domainName.trim() || isChecking}
                            >
                                {isChecking ? 'Checking...' : 'Check Availability'}
                            </button>
                        </div>

                        {domainAvailable !== null && (
                            <div className={`domain-status ${domainAvailable ? 'available' : 'unavailable'}`}>
                                {domainAvailable
                                    ? <><span className="status-icon">✓</span> {domainName}.dash.app is available!</>
                                    : <><span className="status-icon">✗</span> This domain is already taken. Please try another.</>
                                }
                            </div>
                        )}

                        <div className="domain-tips">
                            <h3>Tips for a good domain name:</h3>
                            <ul>
                                <li>Keep it short and memorable</li>
                                <li>Use your restaurant name or a variation</li>
                                <li>Avoid special characters and numbers if possible</li>
                            </ul>
                        </div>

                        <div className="form-buttons domain-buttons">
                            <button
                                type="button"
                                className="next-button"
                                onClick={() => setStep(2)}
                                disabled={!domainAvailable}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="onboarding-step info-step">
                        <h2>Tell us about your restaurant</h2>
                        <p className="step-description">This information will be displayed on your website.</p>

                        <form onSubmit={handleSubmitInfo} className="restaurant-info-form">
                            <div className="form-group">
                                <label htmlFor="name">Restaurant Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={restaurantInfo.name}
                                    onChange={handleInfoChange}
                                    placeholder="e.g., Taste of India"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="bio">Restaurant Bio</label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    value={restaurantInfo.bio}
                                    onChange={handleInfoChange}
                                    placeholder="Tell customers about your restaurant, cuisine, and what makes you special..."
                                    rows={4}
                                    required
                                ></textarea>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="phone">Phone Number</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={restaurantInfo.phone}
                                        onChange={handleInfoChange}
                                        placeholder="e.g., (555) 123-4567"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={restaurantInfo.email}
                                        onChange={handleInfoChange}
                                        placeholder="e.g., contact@yourrestaurant.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="address">Restaurant Address</label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={restaurantInfo.address}
                                    onChange={handleInfoChange}
                                    placeholder="e.g., 123 Main St, City, State, ZIP"
                                    required
                                />
                            </div>

                            <div className="form-buttons">
                                <button type="button" className="back-button" onClick={() => setStep(1)}>
                                    Back
                                </button>
                                <button type="submit" className="next-button">
                                    Next
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {step === 3 && (
                    <MenuSelectionStep
                        onNext={handleMenuNext}
                        onBack={() => setStep(2)}
                    />
                )}

                {step === 4 && (
                    <div className="onboarding-step summary-step">
                        <h2>Almost there!</h2>
                        <p className="step-description">Review your information before creating your website.</p>

                        <div className="summary-card">
                            <div className="summary-section">
                                <h3>Website Domain</h3>
                                <p className="domain-preview">{domainName}.dash.app</p>
                            </div>

                            <div className="summary-section">
                                <h3>Restaurant Details</h3>
                                <div className="summary-detail">
                                    <span className="detail-label">Name:</span>
                                    <span className="detail-value">{restaurantInfo.name}</span>
                                </div>
                                <div className="summary-detail">
                                    <span className="detail-label">Bio:</span>
                                    <span className="detail-value bio-preview">{restaurantInfo.bio}</span>
                                </div>
                                <div className="summary-detail">
                                    <span className="detail-label">Contact:</span>
                                    <span className="detail-value">{restaurantInfo.phone} | {restaurantInfo.email}</span>
                                </div>
                                <div className="summary-detail">
                                    <span className="detail-label">Address:</span>
                                    <span className="detail-value">{restaurantInfo.address}</span>
                                </div>
                            </div>

                            <div className="summary-section">
                                <h3>Menu Selection</h3>
                                <div className="summary-detail">
                                    <span className="detail-label">Standard Categories:</span>
                                    <span className="detail-value">{menuSelections.standardCategories.length}</span>
                                </div>
                                <div className="summary-detail">
                                    <span className="detail-label">Custom Categories:</span>
                                    <span className="detail-value">{menuSelections.customCategories.length}</span>
                                </div>
                                <div className="summary-detail">
                                    <span className="detail-label">Total Menu Items:</span>
                                    <span className="detail-value">
                                        {Object.values(menuSelections.standardItems).reduce((count, items) => count + items.length, 0) +
                                            Object.values(menuSelections.customItems).reduce((count, items) => count + items.length, 0)}
                                    </span>
                                </div>
                            </div>
                            <div className="summary-section">
                                <h3>Enable Ordering</h3>
                                <label className="toggle-label">
                                    <span>Enable Ordering</span>
                                    <input
                                        type="checkbox"
                                        checked={orderingEnabled}
                                        onChange={(e) => setOrderingEnabled(e.target.checked)}
                                    />
                                </label>
                                <p className="toggle-description">Don't worry, you can change it anytime.</p>
                            </div>

                            <div className="next-steps-info">
                                <h3>Next Steps</h3>
                                <p>After creating your website, you'll be able to:</p>
                                <ul>
                                    <li>Customize your website appearance</li>
                                    <li>Start accepting online orders</li>
                                    <li>Track orders and analytics</li>
                                    <li>Manage your menu and restaurant details</li>
                                </ul>
                            </div>
                        </div>

                        <div className="form-buttons">
                            <button type="button" className="back-button" onClick={() => setStep(3)}>
                                Back
                            </button>
                            <button type="button" className="create-website-button" onClick={handleCreateWebsite}>
                                Create My Website
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RestaurantOnboarding;
