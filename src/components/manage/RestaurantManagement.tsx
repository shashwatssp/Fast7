import React, { useState, useEffect } from 'react';
import './RestaurantManagement.css';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../auth/AuthContext';

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

    useEffect(() => {
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
                console.log("ENTER");
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

        fetchRestaurantData();
    }, [currentUser]);

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
            const orderDoc = querySnapshot.docs[0];
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
        return <div className="loading-spinner">Loading...</div>;
    }

    // If error, show error message
    if (error) {
        return (
            <div className="error-container">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={() => window.location.href = "/create"}>Create a Restaurant</button>
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
                                <p>Total: ${selectedOrder.total}</p>
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
                        {/* Edit Menu Card */}
                        <div className="feature-card menu-card">
                            <div className="card-header">
                                <div className="card-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 20h9"></path>
                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                    </svg>
                                </div>
                                <div className="card-title-container">
                                    <h2 className="card-title">Menu Management</h2>
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
                            <div className="card-footer">
                                <a href="#" className="action-button">
                                    Edit Menu
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </a>
                            </div>
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
                    </div>

                    {/* Recent Orders */}
                    <div className="feature-card orders-list-card">
                        <h2 className="card-title">Recent Orders</h2>
                        <p className="card-description">Latest orders from your customers</p>

                        <div className="orders-list">
                            <div className="no-orders-message">
                                <p>No recent orders to display.</p>
                            </div>
                        </div>

                        <div className="card-footer">
                            <a href="#" className="primary-button">
                                View All Orders
                            </a>
                        </div>
                    </div>

                    {/* Pending Orders */}
                    {/* <div className="feature-card orders-card">
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
                    </div> */}

                    {/* Past Orders */}
                    {/* <div className="feature-card orders-card">
                        <h2 className="card-title">Past Orders</h2>
                        <div className="orders-list">
                            {pastOrders.map((order) => (
                                <div key={order.id} className="order-item" onClick={() => setSelectedOrder(order)}>
                                    <span>Order #{order.id}</span>
                                </div>
                            ))}
                            {pastOrders.length === 0 && <p>No past orders</p>}
                        </div>
                    </div> */}

                    {/* Order Details Modal */}
                    {selectedOrder && (
                        <div className="order-modal">
                            <div className="order-modal-content">
                                <h2>Order Details</h2>
                                <p>Order ID: {selectedOrder.id}</p>
                                <p>Customer: {selectedOrder.customer.name}</p>
                                <p>Total: ${selectedOrder.total}</p>
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
                </main>
            </div>
        </div>
    );
};

export default RestaurantManagement;

