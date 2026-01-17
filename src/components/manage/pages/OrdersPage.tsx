import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Order } from '../../../types/Order';
import { useAuth } from '../../../auth/AuthContext';
import PageHeader from '../shared/PageHeader';
import StatsCard from '../shared/StatsCard';
import './OrdersPage.css';

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
      navigate('/restaurant-onboarding');
      return;
    }
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where("restaurantId", "==", restaurantData.id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];

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

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, searchTerm, dateFilter]);

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
      switch (order.status) {
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
      
      if (order.total && !isNaN(order.total)) {
        newStats.revenue += order.total;
      }
    });

    setStats(newStats);
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
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
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return orderDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return orderDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { 
        status: newStatus,
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
    switch (status) {
      case 'pending': return 'Pending';
      case 'delivering': return 'Out for Delivery';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const formatPrice = (price: number) => {
    if (isNaN(price)) return '₹0';
    return `₹${price.toFixed(2)}`;
  };

  const formatDate = (date: any) => {
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
    return (
      <div className="orders-page">
        <div className="orders-loading">
          <div className="loading-spinner"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
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
                          style={{ backgroundColor: getStatusColor(order.status) }}
                        >
                          {getStatusText(order.status)}
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
                      
                      {order.status === 'pending' && (
                        <button
                          className="action-btn confirm-btn"
                          onClick={() => updateOrderStatus(order.id, 'delivering')}
                        >
                          Start Delivery
                        </button>
                      )}
                      
                      {order.status === 'delivering' && (
                        <button
                          className="action-btn complete-btn"
                          onClick={() => updateOrderStatus(order.id, 'completed')}
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
                    style={{ backgroundColor: getStatusColor(selectedOrder.status) }}
                  >
                    {getStatusText(selectedOrder.status)}
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