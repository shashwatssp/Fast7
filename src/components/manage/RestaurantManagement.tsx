

import React, { useState, useEffect, useRef } from 'react';
import './RestaurantManagement.css';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import EditMenuComponent from './EditMenuComponent';
import OrderMap from './OrderMap';
import { Order, Restaurant, CustomerInfo, OrderItem } from '../../types/Order';

const RestaurantManagement = () => {
    const [isOrderingEnabled, setIsOrderingEnabled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { currentUser, logout, restaurantData: authRestaurantData } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [restaurantData, setRestaurantData] = useState<Restaurant | null>(null);
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
    const [deliveringOrders, setDeliveringOrders] = useState<Order[]>([]);
    const [pastOrders, setPastOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showMenuSelection, setShowMenuSelection] = useState(false);
    const [showEditMenu, setShowEditMenu] = useState(false);
    const [showCoverPhotoForm, setShowCoverPhotoForm] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [coverPhoto, setCoverPhoto] = useState("");
    const [showOrderMap, setShowOrderMap] = useState(false);
    const [selectedOrderForMap, setSelectedOrderForMap] = useState<Order | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
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

        // Use restaurant data from AuthContext if available
        if (authRestaurantData) {
            setRestaurantData(authRestaurantData);
            setIsOrderingEnabled(authRestaurantData.orderingEnabled || false);
            fetchOrders(authRestaurantData.id);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // Create a query to find restaurants where ownerId matches currentUser.uid
            const restaurantsRef = collection(db, 'restaurants');
            const q = query(restaurantsRef, where("ownerId", "==", currentUser.uid));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError("No restaurants found for your account");
            } else {
                // Get the first restaurant (assuming a user has one restaurant for simplicity)
                const restaurantDoc = querySnapshot.docs[0];
                const data = restaurantDoc.data();
                setRestaurantData({
                    id: restaurantDoc.id,
                    ...data
                } as Restaurant);
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

    const handleEditMenuClose = (updatedMenu?: any) => {
        // Simply set showMenuSelection to false to hide the EditMenuComponent
        setShowMenuSelection(false);

        // If menu was updated (not just canceled), refresh data
        if (updatedMenu) {
            // Refresh restaurant data or update the local state
            fetchRestaurantData();
        }
    };

    const handleImageUpload = async (file: File) => {
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
            await updateDoc(doc(db, 'restaurants', restaurantData!.id), { coverPhoto });
            setShowCoverPhotoForm(false);

            // Update local state to reflect the change
            setRestaurantData(prev => prev ? ({
                ...prev,
                coverPhoto
            }) : null);
        } catch (err) {
            console.error("Error updating cover photo:", err);
            alert("Failed to update cover photo. Please try again.");
        }
    };

    const fetchOrders = async (restaurantId: string) => {
        try {
            const ordersRef = collection(db, 'orders');
            const q = query(ordersRef, where("restaurantId", "==", restaurantId));
            const querySnapshot = await getDocs(q);

            const pending: Order[] = [];
            const delivering: Order[] = [];
            const past: Order[] = [];

            querySnapshot.forEach((doc) => {
                const orderData = { id: doc.id, ...doc.data() } as Order;
                
                // Fix NaN quantity and price issues by ensuring items have proper values
                if (orderData.items) {
                    orderData.items = orderData.items.map(item => {
                        const quantity = item.quantity || 1;
                        const price = item.price || 0;
                        return {
                            ...item,
                            quantity: isNaN(quantity) ? 1 : Number(quantity),
                            price: isNaN(price) ? 0 : Number(price)
                        };
                    });
                }
                
                if (orderData.status === 'pending' || orderData.pending) {
                    pending.push(orderData);
                } else if (orderData.status === 'delivering') {
                    delivering.push(orderData);
                } else {
                    past.push(orderData);
                }
            });

            // Sort orders from newest to oldest based on createdAt or orderTime
            const sortOrders = (orders: Order[]) => {
                return orders.sort((a, b) => {
                    let timeA: number;
                    let timeB: number;
                    
                    // Try to get time from Firebase Timestamp first
                    if (a.createdAt && typeof a.createdAt.toMillis === 'function') {
                        timeA = a.createdAt.toMillis();
                    } else if (a.orderTime) {
                        timeA = new Date(a.orderTime).getTime();
                    } else {
                        timeA = 0; // Fallback for very old orders
                    }
                    
                    if (b.createdAt && typeof b.createdAt.toMillis === 'function') {
                        timeB = b.createdAt.toMillis();
                    } else if (b.orderTime) {
                        timeB = new Date(b.orderTime).getTime();
                    } else {
                        timeB = 0; // Fallback for very old orders
                    }
                    
                    return timeB - timeA; // Newest first
                });
            };

            setPendingOrders(sortOrders(pending));
            setDeliveringOrders(sortOrders(delivering));
            setPastOrders(sortOrders(past));
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
            await updateDoc(doc(db, 'restaurants', restaurantData!.id), { orderingEnabled: newStatus });
        } catch (err) {
            console.error("Error updating ordering status:", err);
            // Revert the state if update fails
            setIsOrderingEnabled(!newStatus);
        }
    };

    const toggleOrderStatus = async (orderId: string) => {
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
            const orderDoc = querySnapshot.docs[0];
            await updateDoc(orderDoc.ref, {
                pending: false,
                status: 'completed',
                updatedAt: new Date()
            });

            console.log("Order status updated successfully");
            fetchOrders(restaurantData!.id);
        } catch (err) {
            console.error("Error updating order status:", err);
        }
    };

    const startDelivery = async (orderId: string) => {
        try {
            console.log("Starting delivery for order:", orderId);

            const ordersRef = collection(db, 'orders');
            const q = query(ordersRef, where("id", "==", orderId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.error("No order found with ID:", orderId);
                return;
            }

            const orderDoc = querySnapshot.docs[0];
            await updateDoc(orderDoc.ref, {
                pending: false,
                status: 'delivering',
                updatedAt: new Date()
            });

            console.log("Order marked as delivering");
            fetchOrders(restaurantData!.id);
        } catch (err) {
            console.error("Error starting delivery:", err);
        }
    };

    const completeDelivery = async (orderId: string) => {
        try {
            console.log("Completing delivery for order:", orderId);

            const ordersRef = collection(db, 'orders');
            const q = query(ordersRef, where("id", "==", orderId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.error("No order found with ID:", orderId);
                return;
            }

            const orderDoc = querySnapshot.docs[0];
            await updateDoc(orderDoc.ref, {
                status: 'completed',
                updatedAt: new Date()
            });

            console.log("Order marked as completed");
            fetchOrders(restaurantData!.id);
        } catch (err) {
            console.error("Error completing delivery:", err);
        }
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
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
                        <button className="logout-btn" onClick={handleLogout} title="Logout">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                </header>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="mobile-menu">
                        <nav>
                            <a href="/manage/dashboard" className="mobile-menu-item" onClick={(e) => { e.preventDefault(); navigate('/manage/dashboard'); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                                Dashboard
                            </a>
                            <a href="/manage/orders" className="mobile-menu-item" onClick={(e) => { e.preventDefault(); navigate('/manage/orders'); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                Orders
                            </a>
                            <a href="/manage/menu" className="mobile-menu-item" onClick={(e) => { e.preventDefault(); navigate('/manage/menu'); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                </svg>
                                Menu
                            </a>
                            <a href="/manage/settings" className="mobile-menu-item" onClick={(e) => { e.preventDefault(); navigate('/manage/settings'); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                </svg>
                                Settings
                            </a>
                            <a href="#" className="mobile-menu-item" onClick={handleLogout}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                                Logout
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
                        <h2 className="card-title">🕐 Pending Orders ({pendingOrders.length})</h2>
                        <div className="orders-list">
                            {pendingOrders.map((order) => (
                                <div key={order.id} className="order-item">
                                    <div className="order-item-left">
                                        <div className="order-header">
                                            <span className="order-id" onClick={() => setSelectedOrder(order)}>Order #{order.id}</span>
                                            <span className="order-time">
                                                {order.orderTime ? new Date(order.orderTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                                            </span>
                                        </div>
                                        <div className="order-meta">
                                            <span className="customer-name">{order.customer.name}</span>
                                            <span className="customer-phone">{order.customer.phone || 'Not provided'}</span>
                                            <span className="order-total">₹{isNaN(order.total) ? 0 : order.total}</span>
                                        </div>
                                        <div className="order-address">
                                            📍 {order.customer.address}
                                        </div>
                                        {order.customer?.address && (
                                            <button
                                                className="view-map-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedOrderForMap(order);
                                                    setShowOrderMap(true);
                                                }}
                                            >
                                                📍 View Route
                                            </button>
                                        )}
                                    </div>
                                    <div className="order-actions">
                                        <button
                                            className="start-delivery-btn"
                                            onClick={() => startDelivery(order.id)}
                                        >
                                            🚀 Start Delivery
                                        </button>
                                        <button
                                            className="fulfill-btn"
                                            onClick={() => toggleOrderStatus(order.id)}
                                        >
                                            ✓ Complete
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {pendingOrders.length === 0 && <p className="no-orders">No pending orders</p>}
                        </div>
                    </div>

                    {/* Delivering Orders */}
                    <div className="feature-card orders-card">
                        <h2 className="card-title">🚚 Currently Delivering ({deliveringOrders.length})</h2>
                        <div className="orders-list">
                            {deliveringOrders.map((order) => (
                                <div key={order.id} className="order-item delivering">
                                    <div className="order-item-left">
                                        <div className="order-header">
                                            <span className="order-id" onClick={() => setSelectedOrder(order)}>Order #{order.id}</span>
                                            <span className="delivery-status-badge">ON THE WAY</span>
                                        </div>
                                        <div className="order-meta">
                                            <span className="customer-name">{order.customer.name}</span>
                                            <span className="customer-phone">{order.customer.phone || 'Not provided'}</span>
                                            <span className="order-total">₹{isNaN(order.total) ? 0 : order.total}</span>
                                        </div>
                                        <div className="order-address">
                                            📍 {order.customer.address}
                                        </div>
                                        {order.deliveryDistance && (
                                            <span className="delivery-distance">
                                                📍 {Math.round(order.deliveryDistance)}m away
                                            </span>
                                        )}
                                        {order.customer?.address && (
                                            <button
                                                className="view-map-btn track-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedOrderForMap(order);
                                                    setShowOrderMap(true);
                                                }}
                                            >
                                                📍 Track Delivery
                                            </button>
                                        )}
                                    </div>
                                    <div className="order-actions">
                                        <button
                                            className="complete-delivery-btn"
                                            onClick={() => completeDelivery(order.id)}
                                        >
                                            ✓ Delivered
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {deliveringOrders.length === 0 && <p className="no-orders">No orders currently being delivered</p>}
                        </div>
                    </div>

                    {/* Past Orders */}
                    <div className="feature-card orders-card">
                        <h2 className="card-title">✅ Completed Orders ({pastOrders.length})</h2>
                        <div className="orders-list">
                            {pastOrders.map((order) => (
                                <div key={order.id} className="order-item completed">
                                    <div className="order-item-left">
                                        <div className="order-header">
                                            <span className="order-id" onClick={() => setSelectedOrder(order)}>Order #{order.id}</span>
                                            <span className="order-time">
                                                {order.orderTime ? new Date(order.orderTime).toLocaleDateString() : 'Unknown date'}
                                            </span>
                                        </div>
                                        <div className="order-meta">
                                            <span className="customer-name">{order.customer.name}</span>
                                            <span className="order-total">₹{isNaN(order.total) ? 0 : order.total}</span>
                                        </div>
                                        {order.actualDeliveryTime && (
                                            <span className="delivery-time">
                                                ⏱️ Delivered in {order.actualDeliveryTime}min
                                            </span>
                                        )}
                                        {order.customer?.address && (
                                            <button
                                                className="view-map-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedOrderForMap(order);
                                                    setShowOrderMap(true);
                                                }}
                                            >
                                                📍 View Route
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {pastOrders.length === 0 && <p className="no-orders">No completed orders</p>}
                        </div>
                    </div>

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
                                        {restaurantData && Object.values(restaurantData.menuSelections.standardItems).reduce((acc: number, items: any[]) =>
                                            acc + items.length, 0) +
                                            Object.values(restaurantData.menuSelections.customItems).reduce((acc: number, items: any[]) =>
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
                                <a href="/manage/orders" className="action-button" onClick={(e) => { e.preventDefault(); navigate('/manage/orders'); }}>
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
                                    <p className="card-description">Track your revenue and earnings</p>
                                </div>
                            </div>
                            <div className="card-content">
                                <div className="stat-container">
                                    <span className="stat-label">Today's Revenue</span>
                                    <span className="stat-badge">₹0</span>
                                </div>
                            </div>
                            <div className="card-footer">
                                <a href="/manage/dashboard" className="action-button" onClick={(e) => { e.preventDefault(); navigate('/manage/dashboard'); }}>
                                    View Analytics
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Order Detail Modal */}
                {selectedOrder && (
                    <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Order Details</h2>
                                <button className="close-btn" onClick={() => setSelectedOrder(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="order-info">
                                    <p><strong>Order ID:</strong> #{selectedOrder.id}</p>
                                    <p><strong>Customer:</strong> {selectedOrder.customer.name}</p>
                                    <p><strong>Phone:</strong> {selectedOrder.customer.phone || 'Not provided'}</p>
                                    <p><strong>Address:</strong> {selectedOrder.customer.address}</p>
                                    <p><strong>Order Time:</strong> {selectedOrder.orderTime ? new Date(selectedOrder.orderTime).toLocaleString() : 'Unknown'}</p>
                                    <p><strong>Total:</strong> ₹{isNaN(selectedOrder.total) ? 0 : selectedOrder.total}</p>
                                    <p><strong>Status:</strong> {selectedOrder.status || (selectedOrder.pending ? 'Pending' : 'Completed')}</p>
                                </div>
                                <div className="order-items">
                                    <h3>Items:</h3>
                                    {selectedOrder.items.map((item, index) => {
                                        const itemPrice = isNaN(item.price) || item.price === undefined || item.price === null ? 0 : Number(item.price);
                                        const itemQuantity = isNaN(item.quantity) || item.quantity === undefined || item.quantity === null ? 1 : Number(item.quantity);
                                        const itemTotal = itemPrice * itemQuantity;
                                        return (
                                            <div key={index} className="order-item-detail">
                                                <span>{item.name} x {itemQuantity}</span>
                                                <span>₹{isNaN(itemTotal) ? 0 : itemTotal}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cover Photo Modal */}
                {showCoverPhotoForm && (
                    <div className="modal-overlay" onClick={() => setShowCoverPhotoForm(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Edit Cover Photo</h2>
                                <button className="close-btn" onClick={() => setShowCoverPhotoForm(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="cover-photo-form">
                                    <div className="current-photo">
                                        <img src={coverPhoto || defaultCoverPhoto} alt="Current cover" />
                                    </div>
                                    <div className="photo-actions">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                        />
                                        <button
                                            className="upload-btn"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                        >
                                            {uploading ? 'Uploading...' : 'Upload New Photo'}
                                        </button>
                                        <button
                                            className="save-btn"
                                            onClick={handleSaveCoverPhoto}
                                            disabled={uploading}
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Order Map Modal */}
                {showOrderMap && selectedOrderForMap && (
                    <div className="modal-overlay" onClick={() => setShowOrderMap(false)}>
                        <div className="modal-content map-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Delivery Route - Order #{selectedOrderForMap.id}</h2>
                                <button className="close-btn" onClick={() => setShowOrderMap(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <OrderMap
                                    restaurantAddress={restaurantData?.restaurantInfo?.address || 'Restaurant Location'}
                                    deliveryAddress={selectedOrderForMap.customer.address}
                                    orderId={selectedOrderForMap.id}
                                    customerName={selectedOrderForMap.customer.name}
                                    deliveryCoordinates={selectedOrderForMap.deliveryCoordinates || undefined}
                                    onClose={() => setShowOrderMap(false)}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RestaurantManagement;
