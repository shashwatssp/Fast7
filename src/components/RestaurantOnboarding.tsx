import React, { useState } from 'react';
import './RestaurantOnboarding.css';
import MenuSelectionStep from './MenuSelectionStep';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface MenuSelections {
  standardCategories: (number | string)[];
  standardItems: Record<number | string, (number | string)[]>;
  customCategories: string[];
  customItems: Record<string, string[]>;
}

const RestaurantOnboarding = () => {
    const [step, setStep] = useState(1);
    const [domainName, setDomainName] = useState('');
    const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);
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

    // Mock function to check domain availability
    const checkDomainAvailability = (domain: string): Promise<boolean> => {
        // This would be replaced with a Firebase query
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock check - domains with "taken" are unavailable
                resolve(!domain.includes('taken'));
            }, 800);
        });
    };

    const handleDomainCheck = async () => {
        if (!domainName.trim()) return;
        
        const isAvailable = await checkDomainAvailability(domainName);
        setDomainAvailable(isAvailable);
        
        if (isAvailable) {
            // Wait a moment to show the success message before proceeding
            setTimeout(() => setStep(2), 1000);
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
        // This would save the basic info to Firebase
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
                restaurantInfo: {
                    name: restaurantInfo.name,
                    bio: restaurantInfo.bio,
                    phone: restaurantInfo.phone,
                    email: restaurantInfo.email,
                    address: restaurantInfo.address
                },
                menuSelections: {
                    standardCategories: menuSelections.standardCategories,
                    standardItems: menuSelections.standardItems,
                    customCategories: menuSelections.customCategories,
                    customItems: menuSelections.customItems
                },
                createdAt: new Date()
            };
            
            await setDoc(doc(db, 'restaurants', domainPrefix), restaurantData);
            
            console.log("Website created successfully with data:", restaurantData);
            alert("Your website has been created successfully!");
            
            // Optional: Redirect to the new website
            // window.location.href = `https://${domainName}`;
        } catch (error) {
            console.error("Error creating website:", error);
            alert("There was an error creating your website. Please try again.");
        }
    };
    

    return (
        <div className="onboarding-container">
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
                                className="check-domain-btn"
                                onClick={handleDomainCheck}
                                disabled={!domainName.trim()}
                            >
                                Check Availability
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
