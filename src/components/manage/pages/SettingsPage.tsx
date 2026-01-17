import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../auth/AuthContext';
import PageHeader from '../shared/PageHeader';
import StatsCard from '../shared/StatsCard';
import './SettingsPage.css';

interface RestaurantSettings {
  restaurantName: string;
  email: string;
  phone: string;
  address: string;
  cuisine: string;
  openingTime: string;
  closingTime: string;
  deliveryRadius: number;
  minOrderAmount: number;
  deliveryFee: number;
  estimatedDeliveryTime: number;
  acceptOrders: boolean;
  acceptDelivery: boolean;
  acceptPickup: boolean;
  taxRate: number;
  description: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { restaurantData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'operations' | 'payment' | 'social'>('basic');
  const [settings, setSettings] = useState<RestaurantSettings>({
    restaurantName: '',
    email: '',
    phone: '',
    address: '',
    cuisine: '',
    openingTime: '09:00',
    closingTime: '22:00',
    deliveryRadius: 5,
    minOrderAmount: 100,
    deliveryFee: 40,
    estimatedDeliveryTime: 30,
    acceptOrders: true,
    acceptDelivery: true,
    acceptPickup: true,
    taxRate: 5,
    description: '',
    website: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: ''
    }
  });

  useEffect(() => {
    if (!restaurantData?.id) {
      navigate('/restaurant-onboarding');
      return;
    }

    fetchRestaurantSettings();
  }, [restaurantData, navigate]);

  const fetchRestaurantSettings = async () => {
    try {
      const restaurantRef = doc(db, 'restaurants', restaurantData.id);
      const restaurantDoc = await getDoc(restaurantRef);
      
      if (restaurantDoc.exists()) {
        const data = restaurantDoc.data();
        const processedSettings = {
          restaurantName: data.restaurantName || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          cuisine: data.cuisine || '',
          openingTime: data.openingTime || '09:00',
          closingTime: data.closingTime || '22:00',
          deliveryRadius: data.deliveryRadius || 5,
          minOrderAmount: data.minOrderAmount || 100,
          deliveryFee: data.deliveryFee || 40,
          estimatedDeliveryTime: data.estimatedDeliveryTime || 30,
          acceptOrders: data.acceptOrders !== false,
          acceptDelivery: data.acceptDelivery !== false,
          acceptPickup: data.acceptPickup !== false,
          taxRate: data.taxRate || 5,
          description: data.description || '',
          website: data.website || '',
          socialMedia: data.socialMedia || {
            facebook: '',
            instagram: '',
            twitter: ''
          }
        };
        setSettings(processedSettings);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching restaurant settings:", error);
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof RestaurantSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const restaurantRef = doc(db, 'restaurants', restaurantData.id);
      await updateDoc(restaurantRef, {
        ...settings,
        updatedAt: new Date()
      });
      
      // Show success message (you could add a toast notification here)
      alert('Settings saved successfully!');
    } catch (error) {
      console.error("Error saving settings:", error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      setSettings({
        restaurantName: '',
        email: '',
        phone: '',
        address: '',
        cuisine: '',
        openingTime: '09:00',
        closingTime: '22:00',
        deliveryRadius: 5,
        minOrderAmount: 100,
        deliveryFee: 40,
        estimatedDeliveryTime: 30,
        acceptOrders: true,
        acceptDelivery: true,
        acceptPickup: true,
        taxRate: 5,
        description: '',
        website: '',
        socialMedia: {
          facebook: '',
          instagram: '',
          twitter: ''
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-loading">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="animated-bg">
        <div className="settings-container">
          <PageHeader 
            title="Restaurant Settings" 
            subtitle="Manage your restaurant configuration and preferences"
          />

          {/* Quick Stats */}
          <div className="stats-grid">
            <StatsCard
              title="Order Status"
              value={settings.acceptOrders ? 'Active' : 'Inactive'}
              subtitle={settings.acceptOrders ? 'Accepting orders' : 'Not accepting orders'}
              color={settings.acceptOrders ? 'success' : 'warning'}
            />
            <StatsCard
              title="Delivery"
              value={settings.acceptDelivery ? 'Available' : 'Unavailable'}
              subtitle={settings.acceptDelivery ? `Within ${settings.deliveryRadius} km` : 'Delivery disabled'}
              color={settings.acceptDelivery ? 'success' : 'warning'}
            />
            <StatsCard
              title="Pickup"
              value={settings.acceptPickup ? 'Available' : 'Unavailable'}
              subtitle={settings.acceptPickup ? 'Self-pickup enabled' : 'Pickup disabled'}
              color={settings.acceptPickup ? 'success' : 'warning'}
            />
            <StatsCard
              title="Min Order"
              value={`₹${settings.minOrderAmount}`}
              subtitle="Minimum order amount"
              color="info"
            />
          </div>

          {/* Settings Tabs */}
          <div className="settings-content">
            <div className="settings-tabs">
              <button 
                className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                Basic Info
              </button>
              <button 
                className={`tab-btn ${activeTab === 'operations' ? 'active' : ''}`}
                onClick={() => setActiveTab('operations')}
              >
                Operations
              </button>
              <button 
                className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
                onClick={() => setActiveTab('payment')}
              >
                Payment & Pricing
              </button>
              <button 
                className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
                onClick={() => setActiveTab('social')}
              >
                Social & Web
              </button>
            </div>

            <div className="settings-form">
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <div className="tab-content">
                  <h3>Basic Information</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Restaurant Name *</label>
                      <input
                        type="text"
                        value={settings.restaurantName}
                        onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                        placeholder="Enter restaurant name"
                      />
                    </div>

                    <div className="form-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        value={settings.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="restaurant@example.com"
                      />
                    </div>

                    <div className="form-group">
                      <label>Phone *</label>
                      <input
                        type="tel"
                        value={settings.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div className="form-group">
                      <label>Cuisine Type *</label>
                      <input
                        type="text"
                        value={settings.cuisine}
                        onChange={(e) => handleInputChange('cuisine', e.target.value)}
                        placeholder="e.g., Indian, Chinese, Italian"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Address *</label>
                      <textarea
                        value={settings.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Enter full restaurant address"
                        rows={3}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Description</label>
                      <textarea
                        value={settings.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe your restaurant, specialties, ambiance..."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Operations Tab */}
              {activeTab === 'operations' && (
                <div className="tab-content">
                  <h3>Operations Settings</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Opening Time</label>
                      <input
                        type="time"
                        value={settings.openingTime}
                        onChange={(e) => handleInputChange('openingTime', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Closing Time</label>
                      <input
                        type="time"
                        value={settings.closingTime}
                        onChange={(e) => handleInputChange('closingTime', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Delivery Radius (km)</label>
                      <input
                        type="number"
                        value={settings.deliveryRadius}
                        onChange={(e) => handleInputChange('deliveryRadius', parseInt(e.target.value) || 0)}
                        min="1"
                        max="50"
                      />
                    </div>

                    <div className="form-group">
                      <label>Estimated Delivery Time (minutes)</label>
                      <input
                        type="number"
                        value={settings.estimatedDeliveryTime}
                        onChange={(e) => handleInputChange('estimatedDeliveryTime', parseInt(e.target.value) || 0)}
                        min="10"
                        max="120"
                      />
                    </div>

                    <div className="form-group full-width">
                      <div className="toggle-group">
                        <label className="toggle-label">
                          <input
                            type="checkbox"
                            checked={settings.acceptOrders}
                            onChange={(e) => handleInputChange('acceptOrders', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                          Accept Orders
                        </label>
                        <small>Enable or disable order acceptance</small>
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="toggle-group">
                        <label className="toggle-label">
                          <input
                            type="checkbox"
                            checked={settings.acceptDelivery}
                            onChange={(e) => handleInputChange('acceptDelivery', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                          Accept Delivery
                        </label>
                        <small>Offer home delivery</small>
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="toggle-group">
                        <label className="toggle-label">
                          <input
                            type="checkbox"
                            checked={settings.acceptPickup}
                            onChange={(e) => handleInputChange('acceptPickup', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                          Accept Pickup
                        </label>
                        <small>Allow self-pickup orders</small>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment & Pricing Tab */}
              {activeTab === 'payment' && (
                <div className="tab-content">
                  <h3>Payment & Pricing</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Minimum Order Amount (₹)</label>
                      <input
                        type="number"
                        value={settings.minOrderAmount}
                        onChange={(e) => handleInputChange('minOrderAmount', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="10"
                      />
                    </div>

                    <div className="form-group">
                      <label>Delivery Fee (₹)</label>
                      <input
                        type="number"
                        value={settings.deliveryFee}
                        onChange={(e) => handleInputChange('deliveryFee', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="5"
                      />
                    </div>

                    <div className="form-group">
                      <label>Tax Rate (%)</label>
                      <input
                        type="number"
                        value={settings.taxRate}
                        onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="30"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Social & Web Tab */}
              {activeTab === 'social' && (
                <div className="tab-content">
                  <h3>Social Media & Website</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Website</label>
                      <input
                        type="url"
                        value={settings.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://www.restaurant.com"
                      />
                    </div>

                    <div className="form-group">
                      <label>Facebook</label>
                      <input
                        type="url"
                        value={settings.socialMedia?.facebook || ''}
                        onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                        placeholder="https://www.facebook.com/restaurant"
                      />
                    </div>

                    <div className="form-group">
                      <label>Instagram</label>
                      <input
                        type="url"
                        value={settings.socialMedia?.instagram || ''}
                        onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                        placeholder="https://www.instagram.com/restaurant"
                      />
                    </div>

                    <div className="form-group">
                      <label>Twitter</label>
                      <input
                        type="url"
                        value={settings.socialMedia?.twitter || ''}
                        onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                        placeholder="https://www.twitter.com/restaurant"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="settings-actions">
                <button 
                  className="reset-btn"
                  onClick={handleResetSettings}
                >
                  Reset to Default
                </button>
                <button 
                  className="save-btn"
                  onClick={handleSaveSettings}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;