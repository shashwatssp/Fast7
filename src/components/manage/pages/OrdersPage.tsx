import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Order } from '../../../types/Order';
import { getEffectiveOrderStatus, ORDER_STATUS_LABEL } from '../../../utils/orderStatus';
import { useAuth } from '../../../auth/AuthContext';
import PageHeader from '../shared/PageHeader';
import StatsCard from '../shared/StatsCard';
import './OrdersPage.css';
import LoadingScreen from '../../LoadingScreen';

interface OrderStats {
  total: number;
  pending: number;
  delivering: number;
  completed: number;
  cancelled: number;
  revenue: number;
}

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { restaurantData } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    delivering: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0
  });
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    if (!restaurantData?.id) {
      navigate('/onboarding');
      return;
    }
    const ordersRef = collection(db, 'orders');
    // Match both the doc id and the legacy full-domain value (orders placed
    // before the restaurantId fix carry domainName instead of the doc id).
    const q = query(
      ordersRef,
      where("restaurantId", "in", [restaurantData.id, restaurantData.domainName].filter(Boolean))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Keep the Firestore doc id (docId) AND the business order id (`id`:
      // e.g. ORD-...) separate so status updates always target the right doc.
      const uniqueOrders = new Map<string, Order & { docId: string }>();
      snapshot.docs.forEach(orderDoc => {
        const data = orderDoc.data() as Order;
        const order = { ...data, docId: orderDoc.id, id: data.id || orderDoc.id };
        const previous = uniqueOrders.get(order.id);
        if (!previous || (order.updatedAt?.toMillis?.() || 0) >= (previous.updatedAt?.toMillis?.() || 0)) {
          uniqueOrders.set(order.id, order);
        }
      });
      const ordersData = Array.from(uniqueOrders.values()).sort((a, b) =>
        (b.createdAt?.toMillis?.() || Date.parse(b.orderTime || '') || 0) -
        (a.createdAt?.toMillis?.() || Date.parse(a.orderTime || '') || 0)
      );

      setOrders(ordersData);
      calculateStats(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [restaurantData, navigate]);

  const calculateStats = (ordersData: Order[]) => {
    const newStats: OrderStats = {
      total: ordersData.length,
      pending: 0,
      delivering: 0,
      completed: 0,
      cancelled: 0,
      revenue: 0
    };

    ordersData.forEach(order => {
      // Resolve ONE authoritative status per order (legacy `pending` flag
      // must never contradict the `status` field)
      switch (getEffectiveOrderStatus(order)) {
        case 'pending':
          newStats.pending++;
          break;
        case 'delivering':
          newStats.delivering++;
          break;
        case 'completed':
          newStats.completed++;
          break;
        case 'cancelled':
          newStats.cancelled++;
          break;
      }
      
      if (order.total && !isNaN(order.total) && getEffectiveOrderStatus(order) !== 'cancelled') {
        newStats.revenue += order.total;
      }
    });

    setStats(newStats);
  };

  const filterOrders = React.useCallback(() => {
    let filtered = [...orders];

    // Status filter (against the ONE resolved status per order)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => getEffectiveOrderStatus(order) === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.phone?.includes(searchTerm) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = order.createdAt.toDate();
        
        switch (dateFilter) {
          case 'today':
            return orderDate >= today;
          case 'week': {
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return orderDate >= weekAgo;
          }
          case 'month': {
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return orderDate >= monthAgo;
          }
          default:
            return true;
        }
      });
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchTerm, dateFilter]);

  // Declared AFTER filterOrders on purpose: this effect's dependency array is
  // evaluated during render, so a reference above the const's initialization
  // throws "Cannot access 'filterOrders' before initialization" and crashes
  // the whole page (the View All Orders white screen).
  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, searchTerm, dateFilter, filterOrders]);

  const updateOrderStatus = async (docId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, 'orders', docId);
      await updateDoc(orderRef, { 
        status: newStatus,
        // Keep the legacy flag in sync so the order can never read as
        // pending AND delivering/delivered at the same time
        pending: false,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'delivering': return '#2196f3';
      case 'completed': return '#4caf50';
      case 'cancelled': return '#f44336';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    return ORDER_STATUS_LABEL[status as Order['status']] || status;
  };

  const formatPrice = (price: number) => {
    if (isNaN(price)) return '₹0';
    return `₹${price.toFixed(2)}`;
  };

  const formatDate = (date: Order['createdAt']) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleString();
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  if (loading) {
    return <LoadingScreen message="Loading orders…" />;
  }

  return (
    <div className="orders-page">
      <div className="animated-bg">
        <div className="orders-container">
          <PageHeader 
            title="Orders Management" 
            subtitle="Manage and track all your orders"
          />

          {/* Stats Cards */}
          <div className="stats-grid">
            <StatsCard
              title="Total Orders"
              value={stats.total}
              subtitle="All time orders"
              color="primary"
            />
            <StatsCard
              title="Pending"
              value={stats.pending}
              subtitle="Awaiting confirmation"
              color="warning"
            />
            <StatsCard
              title="Delivering"
              value={stats.delivering}
              subtitle="Out for delivery"
              color="info"
            />
            <StatsCard
              title="Completed"
              value={stats.completed}
              subtitle="Delivered orders"
              color="success"
            />
            <StatsCard
              title="Revenue"
              value={formatPrice(stats.revenue)}
              subtitle="Total earnings"
              color="success"
            />
          </div>

          {/* Filters */}
          <div className="filters-section">
            <div className="filter-group">
              <label>Status:</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="delivering">Out for Delivery</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Date:</label>
              <select 
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            <div className="filter-group search-group">
              <label>Search:</label>
              <input
                type="text"
                placeholder="Search by name, phone, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* Orders List */}
          <div className="orders-list-section">
            <h2 className="section-title">Orders ({filteredOrders.length})</h2>
            
            {filteredOrders.length === 0 ? (
              <div className="no-orders">
                <p>No orders found matching your criteria.</p>
              </div>
            ) : (
              <div className="orders-list">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div className="order-info">
                        <h3 className="order-id">Order #{order.id.slice(-8)}</h3>
                        <p className="customer-name">{order.customer?.name || 'Guest Customer'}</p>
                        <p className="customer-phone">{order.customer?.phone || 'No phone'}</p>
                      </div>
                      <div className="order-status">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(getEffectiveOrderStatus(order)) }}
                        >
                          {getStatusText(getEffectiveOrderStatus(order))}
                        </span>
                      </div>
                    </div>

                    <div className="order-details">
                      <div className="order-items">
                        {order.items?.slice(0, 3).map((item, index) => (
                          <span key={index} className="item-tag">
                            {item.name} × {item.quantity}
                          </span>
                        ))}
                        {order.items && order.items.length > 3 && (
                          <span className="item-tag more-items">
                            +{order.items.length - 3} more
                          </span>
                        )}
                      </div>
                      
                      <div className="order-meta">
                        <span className="order-amount">{formatPrice(order.total || 0)}</span>
                        <span className="order-date">{formatDate(order.createdAt)}</span>
                      </div>
                    </div>

                    <div className="order-actions">
                      <button 
                        className="view-btn"
                        onClick={() => openOrderDetails(order)}
                      >
                        View Details
                      </button>
                      
                      {getEffectiveOrderStatus(order) === 'pending' && (
                        <button
                          className="action-btn confirm-btn"
                          onClick={() => updateOrderStatus((order as Order & { docId: string }).docId, 'delivering')}
                        >
                          Start Delivery
                        </button>
                      )}
                      
                      {getEffectiveOrderStatus(order) === 'delivering' && (
                        <button
                          className="action-btn complete-btn"
                          onClick={() => updateOrderStatus((order as Order & { docId: string }).docId, 'completed')}
                        >
                          Complete Order
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="order-modal-overlay" onClick={closeOrderDetails}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details</h3>
              <button className="close-btn" onClick={closeOrderDetails}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="order-summary">
                <div className="summary-row">
                  <span>Order ID:</span>
                  <span>#{selectedOrder.id}</span>
                </div>
                <div className="summary-row">
                  <span>Customer:</span>
                  <span>{selectedOrder.customer?.name || 'Guest'}</span>
                </div>
                <div className="summary-row">
                  <span>Phone:</span>
                  <span>{selectedOrder.customer?.phone || 'Not provided'}</span>
                </div>
                <div className="summary-row">
                  <span>Status:</span>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(getEffectiveOrderStatus(selectedOrder)) }}
                  >
                    {getStatusText(getEffectiveOrderStatus(selectedOrder))}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Order Date:</span>
                  <span>{formatDate(selectedOrder.createdAt)}</span>
                </div>
              </div>

              <div className="order-items-detail">
                <h4>Order Items</h4>
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className="item-row">
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">× {item.quantity}</span>
                    </div>
                    <span className="item-price">{formatPrice((item.price || 0) * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="order-total">
                <div className="total-row">
                  <span>Total Amount:</span>
                  <span className="total-amount">{formatPrice(selectedOrder.total || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;