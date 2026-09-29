

import React, { useState, useEffect, useRef } from 'react';
import './RestaurantManagement.css';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import EditMenuComponent from './EditMenuComponent';
import OrderMap from './OrderMap';
import { Order, Restaurant, CustomerInfo, OrderItem } from '../../types/Order';
import { getEffectiveOrderStatus } from '../../utils/orderStatus';
import {
  Menu as MenuIcon,
  Bell,
  LogOut,
  Home,
  ClipboardList,
  UtensilsCrossed,
  Settings,
  Palette,
  Clock,
  Truck,
  CheckCircle2,
  MapPin,
  Rocket,
  Check,
  X,
  ExternalLink,
  Store,
  Plus,
} from 'lucide-react';


const RestaurantManagement = () => {
    const [isOrderingEnabled, setIsOrderingEnabled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { currentUser, logout, loading, restaurantData, restaurants: myRestaurants, activeRestaurantId: activeId, setActiveRestaurantId: setActiveId, refreshRestaurantData } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
    const [deliveringOrders, setDeliveringOrders] = useState<Order[]>([]);
    const [pastOrders, setPastOrders] = useState<Order[]>([]);
    const [cancelledCount, setCancelledCount] = useState(0);
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

    // Follow the active website's orders, including updates made from other pages.
    useEffect(() => {
        if (!restaurantData?.id) {
            setPendingOrders([]);
            setDeliveringOrders([]);
            setPastOrders([]);
            setCancelledCount(0);
            return;
        }
        setIsOrderingEnabled((restaurantData as Restaurant).orderingEnabled || false);
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where("restaurantId", "==", restaurantData.id));
        return onSnapshot(q, (snapshot) => {
            const pending: Order[] = [];
            const delivering: Order[] = [];
            const past: Order[] = [];
            let cancelled = 0;
            const uniqueOrders = new Map<string, Order & { docId: string }>();

            snapshot.forEach((orderDoc) => {
                const data = orderDoc.data() as Order;
                const orderData = {
                    ...data,
                    id: data.id || orderDoc.id,
                    docId: orderDoc.id,
                    items: data.items?.map(item => ({
                        ...item,
                        quantity: Number.isFinite(Number(item.quantity)) ? Number(item.quantity) || 1 : 1,
                        price: Number.isFinite(Number(item.price)) ? Number(item.price) : 0
                    }))
                };
                const previous = uniqueOrders.get(orderData.id);
                const updatedAt = orderData.updatedAt?.toMillis?.() || 0;
                if (!previous || updatedAt >= (previous.updatedAt?.toMillis?.() || 0)) {
                    uniqueOrders.set(orderData.id, orderData);
                }
            });

            uniqueOrders.forEach(order => {
                switch (getEffectiveOrderStatus(order)) {
                    case 'pending': pending.push(order); break;
                    case 'delivering': delivering.push(order); break;
                    case 'completed': past.push(order); break;
                    case 'cancelled': cancelled++; break;
                }
            });
            const sortOrders = (orders: Order[]) => orders.sort((a, b) =>
                (b.createdAt?.toMillis?.() || Date.parse(b.orderTime || '') || 0) -
                (a.createdAt?.toMillis?.() || Date.parse(a.orderTime || '') || 0)
            );
            setPendingOrders(sortOrders(pending));
            setDeliveringOrders(sortOrders(delivering));
            setPastOrders(sortOrders(past));
            setCancelledCount(cancelled);
        }, err => console.error("Error fetching orders:", err));
    }, [restaurantData]);

    const handleEditMenuClose = (updatedMenu?: any) => {
        // Simply set showMenuSelection to false to hide the EditMenuComponent
        setShowMenuSelection(false);

        // If menu was updated (not just canceled), refresh data
        if (updatedMenu) {
            // Refresh restaurant data or update the local state
            refreshRestaurantData();
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

            // Refresh shared state to reflect the change
            await refreshRestaurantData();
        } catch (err) {
            console.error("Error updating cover photo:", err);
            alert("Failed to update cover photo. Please try again.");
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

    const updateOrderStatus = async (order: Order, status: Order['status']) => {
        try {
            const docId = (order as Order & { docId: string }).docId;
            await updateDoc(doc(db, 'orders', docId), {
                pending: false,
                status,
                updatedAt: new Date()
            });
        } catch (err) {
            console.error("Error updating order status:", err);
            alert("Could not update this order. Please try again.");
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

    // If the user owns no websites at all, show an appropriate message
    if (!restaurantData || myRestaurants.length === 0) {
        return (
            <div className="no-restaurant-container">
                <h2>No Website Yet</h2>
                <p>You don't have any websites associated with your account. Create your first website — it only takes 7 minutes.</p>
                <button onClick={() => navigate('/onboarding')}><Plus size={16} /> Create Your First Website</button>
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
                        <button className="menu-button" onClick={toggleMobileMenu} aria-label="Menu">
                            <MenuIcon size={24} />
                        </button>
                        <h1 className="restaurant-name">{restaurantData.restaurantInfo.name}</h1>
                    </div>
                    <div className="header-right">
                        <div className="notification-bell">
                            <Bell size={24} />
                            <span className="notification-badge">0</span>
                        </div>
                        <button className="logout-btn" onClick={handleLogout} title="Logout" aria-label="Logout">
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="mobile-menu">
                    <nav>
                            <a href="/manage/dashboard" className="mobile-menu-item" onClick={(e) => { e.preventDefault(); navigate('/manage/dashboard'); }}>
                                <Home size={20} />
                                Dashboard
                            </a>
                            <a href="/manage/orders" className="mobile-menu-item" onClick={(e) => { e.preventDefault(); navigate('/manage/orders'); }}>
                                <ClipboardList size={20} />
                                Orders
                            </a>
                            <a href="/manage/menu" className="mobile-menu-item" onClick={(e) => { e.preventDefault(); navigate('/manage/menu'); }}>
                                <UtensilsCrossed size={20} />
                                Menu
                            </a>
                            <a href="/manage/templates" className="mobile-menu-item" onClick={(e) => { e.preventDefault(); navigate('/manage/templates'); }}>
                                <Palette size={20} />
                                Templates
                            </a>
                            <a href="/manage/settings" className="mobile-menu-item" onClick={(e) => { e.preventDefault(); navigate('/manage/settings'); }}>
                                <Settings size={20} />
                                Settings
                            </a>
                            <a href="#" className="mobile-menu-item" onClick={handleLogout}>
                                <LogOut size={20} />
                                Logout
                            </a>
                        </nav>
                    </div>
                )}

                {/* Main Content */}
                <main className="dashboard-main">
                    {/* Greeting band with website switcher */}
                    <div className="greeting-band">
                        <div className="greeting-left">
                            <p className="greeting-hello">Welcome back</p>
                            <h1 className="greeting-name">{restaurantData.restaurantInfo?.name || activeId}</h1>
                            <div className="greeting-meta">
                                <a
                                    className="live-site-link"
                                    href={`/${activeId}`}
                                    onClick={(e) => { e.preventDefault(); navigate(`/${activeId}`); }}
                                >
                                    <ExternalLink size={14} /> View Live Site
                                </a>
                                {myRestaurants.length > 1 && (
                                    <span className="greeting-count">{myRestaurants.length} websites</span>
                                )}
                            </div>
                        </div>
                        <div className="greeting-actions">
                            {myRestaurants.length > 1 && (
                                <label className="website-switcher">
                                    <Store size={16} />
                                    <select
                                        value={activeId || ""}
                                        onChange={(e) => setActiveId(e.target.value)}
                                    >
                                        {myRestaurants.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.restaurantInfo?.name || r.id}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}
                            <button className="new-website-btn" onClick={() => navigate('/onboarding')}>
                                <Plus size={16} /> New Website
                            </button>
                        </div>
                    </div>
                    <p className="order-count-summary">
                        Total orders: {pendingOrders.length + deliveringOrders.length + pastOrders.length + cancelledCount}
                        <span> · In transit: {deliveringOrders.length} · Delivered: {pastOrders.length}{cancelledCount > 0 ? ` · Cancelled: ${cancelledCount}` : ''}</span>
                    </p>

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
                        <h2 className="card-title"><Clock size={18} /> Pending Orders ({pendingOrders.length})</h2>
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
                                            <MapPin size={14} /> {order.customer.address}
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
                                                <MapPin size={15} /> View Route
                                            </button>
                                        )}
                                    </div>
                                    <div className="order-actions">
                                        <button
                                            className="start-delivery-btn"
                                            onClick={() => updateOrderStatus(order, 'delivering')}
                                        >
                                            <Rocket size={15} /> Start Delivery
                                        </button>
                                        <button
                                            className="fulfill-btn"
                                            onClick={() => updateOrderStatus(order, 'completed')}
                                        >
                                            <Check size={15} /> Complete
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {pendingOrders.length === 0 && <p className="no-orders">No pending orders</p>}
                        </div>
                    </div>

                    {/* Delivering Orders */}
                    <div className="feature-card orders-card">
                        <h2 className="card-title"><Truck size={18} /> Currently Delivering ({deliveringOrders.length})</h2>
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
                                            <MapPin size={14} /> {order.customer.address}
                                        </div>
                                        {order.deliveryDistance && (
                                            <span className="delivery-distance">
                                                <MapPin size={14} /> {Math.round(order.deliveryDistance)}m away
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
                                                <MapPin size={15} /> Track Delivery
                                            </button>
                                        )}
                                    </div>
                                    <div className="order-actions">
                                        <button
                                            className="complete-delivery-btn"
                                            onClick={() => updateOrderStatus(order, 'completed')}
                                        >
                                            <Check size={15} /> Delivered
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {deliveringOrders.length === 0 && <p className="no-orders">No orders currently being delivered</p>}
                        </div>
                    </div>

                    {/* Past Orders */}
                    <div className="feature-card orders-card">
                        <h2 className="card-title"><CheckCircle2 size={18} /> Completed Orders ({pastOrders.length})</h2>
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
                                                <Clock size={14} /> Delivered in {order.actualDeliveryTime}min
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
                                                <MapPin size={15} /> View Route
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

                        {/* Website Templates Card */}
                        <div className="feature-card templates-card">
                            <div className="card-header">
                                <div className="card-icon">
                                    <Palette size={22} />
                                </div>
                                <div className="card-title-container">
                                    <h2 className="card-title">Website Templates</h2>
                                    <p className="card-description">Give your website a fresh new look</p>
                                </div>
                            </div>
                            <div className="card-content">
                                <div className="stat-container">
                                    <span className="stat-label">Designer Themes</span>
                                    <span className="stat-badge">6</span>
                                </div>
                            </div>
                            <div className="card-footer">
                                <a href="/manage/templates" className="action-button" onClick={(e) => { e.preventDefault(); navigate('/manage/templates'); }}>
                                    Browse Templates
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
                                <button className="close-btn" onClick={() => setSelectedOrder(null)}><X size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <div className="order-info">
                                    <p><strong>Order ID:</strong> #{selectedOrder.id}</p>
                                    <p><strong>Customer:</strong> {selectedOrder.customer.name}</p>
                                    <p><strong>Phone:</strong> {selectedOrder.customer.phone || 'Not provided'}</p>
                                    <p><strong>Address:</strong> {selectedOrder.customer.address}</p>
                                    <p><strong>Order Time:</strong> {selectedOrder.orderTime ? new Date(selectedOrder.orderTime).toLocaleString() : 'Unknown'}</p>
                                    <p><strong>Total:</strong> ₹{isNaN(selectedOrder.total) ? 0 : selectedOrder.total}</p>
                                    <p><strong>Status:</strong> {getEffectiveOrderStatus(selectedOrder) === 'delivering'
                                        ? 'On the way'
                                        : getEffectiveOrderStatus(selectedOrder) === 'completed'
                                        ? 'Delivered'
                                        : getEffectiveOrderStatus(selectedOrder) === 'cancelled'
                                        ? 'Cancelled'
                                        : 'Pending'}</p>
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
                                <button className="close-btn" onClick={() => setShowCoverPhotoForm(false)}><X size={20} /></button>
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
                                <button className="close-btn" onClick={() => setShowOrderMap(false)}><X size={20} /></button>
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
