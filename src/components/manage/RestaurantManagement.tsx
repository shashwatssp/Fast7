import React, { useState, useEffect, useRef } from 'react';
import './RestaurantManagement.css';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import EditMenuComponent from './EditMenuComponent';

const RestaurantManagement = () => {
    const [isOrderingEnabled, setIsOrderingEnabled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [restaurantData, setRestaurantData] = useState(null);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [pastOrders, setPastOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showMenuSelection, setShowMenuSelection] = useState(false);
    const [showEditMenu, setShowEditMenu] = useState(false);
    const [showCoverPhotoForm, setShowCoverPhotoForm] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [coverPhoto, setCoverPhoto] = useState("");
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const defaultCoverPhoto = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80";

    const handleEditMenuClick = () => {
        setShowMenuSelection(true);
    };

    const handleEditCoverPhotoClick = () => {
        setShowCoverPhotoForm(true);
        setCoverPhoto(restaurantData?.coverPhoto || "");
    };

    const fetchRestaurantData = async () => {
        if (!currentUser) {
            setLoading(false);
            setError("You must be logged in to view this page");
            return;
        }

        try {
            setLoading(true);
            // Create a query to find restaurants where ownerId matches currentUser.uid
            const restaurantsRef = collection(db, 'restaurants');
            const q = query(restaurantsRef, where("ownerId", "==", currentUser.uid));
            const querySnapshot = await getDocs(q);
            console.log(querySnapshot[0]);

            if (querySnapshot.empty) {
                setError("No restaurants found for your account");
            } else {
                // Get the first restaurant (assuming a user has one restaurant for simplicity)
                const restaurantDoc = querySnapshot.docs[0];
                const data = restaurantDoc.data();
                setRestaurantData({
                    id: restaurantDoc.id,
                    ...data
                });
                setIsOrderingEnabled(data.orderingEnabled);
                fetchOrders(restaurantDoc.id);
            }
        } catch (err) {
            console.error("Error fetching restaurant data:", err);
            setError("An error occurred while fetching your restaurant data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRestaurantData();
    }, [currentUser]);

    const handleEditMenuClose = (updatedMenu) => {
        // Simply set showMenuSelection to false to hide the EditMenuComponent
        setShowMenuSelection(false);

        // If menu was updated (not just canceled), refresh data
        if (updatedMenu) {
            // Refresh restaurant data or update the local state
            fetchRestaurantData();
        }
    };

    const handleImageUpload = async (file) => {
        if (!file) return;

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'menu_items');

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/dvm6d9t35/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Upload failed: ${data.error?.message || 'Unknown error'}`);
            }

            if (data.secure_url) {
                setCoverPhoto(data.secure_url);
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveCoverPhoto = async () => {
        try {
            await updateDoc(doc(db, 'restaurants', restaurantData.id), { coverPhoto });
            setShowCoverPhotoForm(false);

            // Update local state to reflect the change
            setRestaurantData(prev => ({
                ...prev,
                coverPhoto
            }));
        } catch (err) {
            console.error("Error updating cover photo:", err);
            alert("Failed to update cover photo. Please try again.");
        }
    };

    const fetchOrders = async (restaurantId) => {
        try {
            const ordersRef = collection(db, 'orders');
            const q = query(ordersRef, where("restaurantId", "==", restaurantId));
            const querySnapshot = await getDocs(q);

            const pending = [];
            const past = [];

            querySnapshot.forEach((doc) => {
                const orderData = { id: doc.id, ...doc.data() };
                if (orderData.pending) {
                    pending.push(orderData);
                } else {
                    past.push(orderData);
                }
            });

            setPendingOrders(pending);
            setPastOrders(past);
        } catch (err) {
            console.error("Error fetching orders:", err);
        }
    };

    const handleBack = () => {
        setShowMenuSelection(false); // Come back to current page
    };

    const toggleOrdering = async () => {
        const newStatus = !isOrderingEnabled;
        setIsOrderingEnabled(newStatus);

        // Update the database
        try {
            await updateDoc(doc(db, 'restaurants', restaurantData.id), { orderingEnabled: newStatus });
        } catch (err) {
            console.error("Error updating ordering status:", err);
            // Revert the state if update fails
            setIsOrderingEnabled(!newStatus);
        }
    };

    const toggleOrderStatus = async (orderId) => {
        try {
            console.log("orderId ", orderId);

            // Query to find the order document with matching id field
            const ordersRef = collection(db, 'orders');
            const q = query(ordersRef, where("id", "==", orderId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.error("No order found with ID:", orderId);
                return;
            }

            // Update the first matching document
            const orderDoc = querySnapshot.docs;
            await updateDoc(orderDoc.ref, { pending: false });

            console.log("Order status updated successfully");
            fetchOrders(restaurantData.id);
        } catch (err) {
            console.error("Error updating order status:", err);
        }
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // If loading, show a loading spinner
    if (loading) {
        return (
            <div className="restaurant-loading">
                <div className="loading-spinner"></div>
                <p>Hold Tight...</p>
            </div>
        )
    }

    // If error, show error message
    if (error) {
        return (
            <div className="error-container">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Try Again</button>
            </div>
        );
    }

    // If no restaurant data, show an appropriate message
    if (!restaurantData) {
        return (
            <div className="no-restaurant-container">
                <h2>No Restaurant Found</h2>
                <p>You don't have any restaurants associated with your account.</p>
                <button onClick={() => window.location.href = "/create"}>Create a Restaurant</button>
            </div>
        );
    }

    if (showMenuSelection) {
        return (
            <EditMenuComponent
                existingMenuSelections={restaurantData.menuSelections}
                restaurantId={restaurantData.id}
                onClose={handleEditMenuClose}
            />
        );
    }

    return (
        <div className="animated-bg">
            <div className="dashboard-container">
                {/* Mobile Header */}
                <header className="dashboard-header">
                    <div className="header-left">
                        <button className="menu-button" onClick={toggleMobileMenu}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        <h1 className="restaurant-name">{restaurantData.restaurantInfo.name}</h1>
                    </div>
                    <div className="header-right">
                        <div className="notification-bell">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                            <span className="notification-badge">0</span>
                        </div>
                    </div>
                </header>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="mobile-menu">
                        <nav>
                            <a href="#" className="mobile-menu-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                                Dashboard
                            </a>
                            <a href="#" className="mobile-menu-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                Orders
                            </a>
                            <a href="#" className="mobile-menu-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                </svg>
                                Menu
                            </a>
                            <a href="#" className="mobile-menu-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                </svg>
                                Settings
                            </a>
                        </nav>
                    </div>
                )}

                {/* Main Content */}
                <main className="dashboard-main">
                    {/* Restaurant Status */}
                    <div className="feature-card status-card">
                        <h2 className="card-title">Restaurant Status</h2>
                        <div className="toggle-container">
                            <div className="toggle-info">
                                <h3>Food Ordering</h3>
                                <p className="toggle-status">
                                    {isOrderingEnabled ? "Currently accepting orders" : "Orders disabled"}
                                </p>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={isOrderingEnabled}
                                    onChange={toggleOrdering}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    {/* Pending Orders */}
                    <div className="feature-card orders-card">
                        <h2 className="card-title">Pending Orders</h2>
                        <div className="orders-list">
                            {pendingOrders.map((order) => (
                                <div key={order.id} className="order-item">
                                    <span onClick={() => setSelectedOrder(order)}>Order #{order.id}</span>
                                    <button onClick={() => toggleOrderStatus(order.id)}>Mark as Fulfilled</button>
                                </div>
                            ))}
                            {pendingOrders.length === 0 && <p>No pending orders</p>}
                        </div>
                    </div>

                    {/* Past Orders */}
                    <div className="feature-card orders-card">
                        <h2 className="card-title">Past Orders</h2>
                        <div className="orders-list">
                            {pastOrders.map((order) => (
                                <div key={order.id} className="order-item" onClick={() => setSelectedOrder(order)}>
                                    <span>Order #{order.id}</span>
                                </div>
                            ))}
                            {pastOrders.length === 0 && <p>No past orders</p>}
                        </div>
                    </div>

                                        {/* Order Details Modal */}
                    {selectedOrder && (
                        <div className="order-modal">
                            <div className="order-modal-content">
                                <h2>Order Details</h2>
                                <p>Order ID: {selectedOrder.id}</p>
                                <p>Customer: {selectedOrder.customer.name}</p>
                                <p>Total: ₹{selectedOrder.total}</p>
                                <h3>Items:</h3>
                                <ul>
                                    {selectedOrder.items.map((item, index) => (
                                        <li key={index}>{item.name} - Quantity: {item.quantity}</li>
                                    ))}
                                </ul>
                                <button onClick={() => setSelectedOrder(null)}>Close</button>
                            </div>
                        </div>
                    )}

                    {/* Action Cards */}
                    <div className="action-cards">
                        {/* Manage Website Card */}
                        <div className="feature-card menu-card">
                            <div className="card-header">
                                <div className="card-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 20h9"></path>
                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                    </svg>
                                </div>
                                <div className="card-title-container">
                                    <h2 className="card-title">Manage Website</h2>
                                    <p className="card-description">Update your menu items and categories</p>
                                </div>
                            </div>
                            <div className="card-content">
                                <div className="stat-container">
                                    <span className="stat-label">Total Items</span>
                                    <span className="stat-badge">
                                        {Object.values(restaurantData.menuSelections.standardItems).reduce((acc, items) =>
                                            acc + items.length, 0) +
                                            Object.values(restaurantData.menuSelections.customItems).reduce((acc, items) =>
                                                acc + items.length, 0)}
                                    </span>
                                </div>
                            </div>
                            {!showMenuSelection ? (
                                <div className="card-footer">
                                    <a href="#" className="action-button" onClick={handleEditMenuClick}>
                                        Edit Menu
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </a>
                                    <a href="#" className="action-button" onClick={handleEditCoverPhotoClick}>
                                        Edit Cover Photo
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                    </a>
                                </div>
                            ) : null}
                        </div>

                        {/* Orders Card */}
                        <div className="feature-card orders-card">
                            <div className="card-header">
                                <div className="card-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                </div>
                                <div className="card-title-container">
                                    <h2 className="card-title">Orders</h2>
                                    <p className="card-description">Manage incoming and past orders</p>
                                </div>
                            </div>
                            <div className="card-content">
                                <div className="stat-container">
                                    <span className="stat-label">Pending Orders</span>
                                    <span className="stat-badge highlight">{pendingOrders.length}</span>
                                </div>
                            </div>
                            <div className="card-footer">
                                <a href="#" className="action-button">
                                    View Orders
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </a>
                            </div>
                        </div>
                        {/* Total Sales Card */}
                        <div className="feature-card sales-card">
                            <div className="card-header">
                                <div className="card-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="1" x2="12" y2="23"></line>
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                    </svg>
                                </div>
                                <div className="card-title-container">
                                    <h2 className="card-title">Total Sales</h2>
                                    <p className="card-description">Your restaurant's lifetime sales</p>
                                </div>
                            </div>
                            <div className="card-content">
                                <div className="stat-container total-sales">
                                    <span className="stat-value">₹{restaurantData.restaurantInfo.totalSalesDone.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Order Details Modal */}
                    {selectedOrder && (
                        <div className="order-modal">
                            <div className="order-modal-content">
                                <h2>Order Details</h2>
                                <p>Order ID: {selectedOrder.id}</p>
                                <p>Customer: {selectedOrder.customer.name}</p>
                                <p>Total: ₹{selectedOrder.total}</p>
                                <h3>Items:</h3>
                                <ul>
                                    {selectedOrder.items.map((item, index) => (
                                        <li key={index}>{item.name}</li>
                                    ))}
                                </ul>
                                <button onClick={() => setSelectedOrder(null)}>Close</button>
                            </div>
                        </div>
                    )}

                    {/* Cover Photo Modal */}
                    {showCoverPhotoForm && (
                        <div className="custom-form-overlay">
                            <div className="custom-item-form">
                                <div className="form-header">
                                    <h3>Edit Cover Photo</h3>
                                    <button
                                        className="close-form-btn"
                                        onClick={() => setShowCoverPhotoForm(false)}
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="form-body">
                                    <div className="form-group">
                                        <label htmlFor="coverPhoto">Cover Photo</label>
                                        <div className="custom-image-upload">
                                            <img
                                                src={coverPhoto || defaultCoverPhoto}
                                                alt="Cover Photo"
                                                className={`custom-image-preview ${uploading ? 'uploading' : ''}`}
                                            />
                                            <div
                                                className="custom-image-upload-icon"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <span>📷</span>
                                                {uploading && <span className="upload-spinner-small"></span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={() => setShowCoverPhotoForm(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="add-item-btn"
                                        onClick={handleSaveCoverPhoto}
                                    >
                                        Save Cover Photo
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                handleImageUpload(e.target.files[0]);
                            }
                        }}
                    />

                </main>
            </div>
        </div>
    );
};

export default RestaurantManagement;
