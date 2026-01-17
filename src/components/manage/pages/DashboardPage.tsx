import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../auth/AuthContext';
import PageHeader from '../shared/PageHeader';
import StatsCard from '../shared/StatsCard';
import './DashboardPage.css';

interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  weekRevenue: number;
  weekOrders: number;
  monthRevenue: number;
  monthOrders: number;
  totalCustomers: number;
  popularItems: Array<{ name: string; count: number; revenue: number }>;
}

const DashboardPage: React.FC = () => {
  const { currentUser, restaurantData: authRestaurantData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    todayOrders: 0,
    weekRevenue: 0,
    weekOrders: 0,
    monthRevenue: 0,
    monthOrders: 0,
    totalCustomers: 0,
    popularItems: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser, authRestaurantData]);

  const fetchDashboardData = async () => {
    if (!currentUser || !authRestaurantData) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where("restaurantId", "==", authRestaurantData.id));
      const querySnapshot = await getDocs(q);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      let todayRevenue = 0;
      let todayOrders = 0;
      let weekRevenue = 0;
      let weekOrders = 0;
      let monthRevenue = 0;
      let monthOrders = 0;
      const customers = new Set();
      const itemStats: { [key: string]: { count: number; revenue: number } } = {};

      querySnapshot.forEach((doc) => {
        const orderData = doc.data();
        const orderTime = orderData.orderTime ? new Date(orderData.orderTime) : null;
        const total = isNaN(orderData.total) ? 0 : Number(orderData.total);

        if (orderTime) {
          // Today's stats
          if (orderTime >= todayStart) {
            todayRevenue += total;
            todayOrders++;
          }

          // Week's stats
          if (orderTime >= weekStart) {
            weekRevenue += total;
            weekOrders++;
          }

          // Month's stats
          if (orderTime >= monthStart) {
            monthRevenue += total;
            monthOrders++;
          }
        }

        // Track customers
        if (orderData.customer?.email) {
          customers.add(orderData.customer.email);
        }

        // Track popular items
        if (orderData.items) {
          orderData.items.forEach((item: any) => {
            const itemName = item.name || 'Unknown Item';
            const itemTotal = (isNaN(item.price) ? 0 : Number(item.price)) * (isNaN(item.quantity) ? 1 : Number(item.quantity));
            
            if (!itemStats[itemName]) {
              itemStats[itemName] = { count: 0, revenue: 0 };
            }
            itemStats[itemName].count += isNaN(item.quantity) ? 1 : Number(item.quantity);
            itemStats[itemName].revenue += itemTotal;
          });
        }
      });

      // Sort popular items by count
      const popularItems = Object.entries(itemStats)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        todayRevenue,
        todayOrders,
        weekRevenue,
        weekOrders,
        monthRevenue,
        monthOrders,
        totalCustomers: customers.size,
        popularItems
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="animated-bg">
      <div className="dashboard-container">
        <PageHeader 
          title="Dashboard" 
          subtitle="Overview of your restaurant performance"
        />

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatsCard
            title="Today's Revenue"
            value={`₹${stats.todayRevenue.toLocaleString()}`}
            subtitle={`${stats.todayOrders} orders`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            }
            color="primary"
          />

          <StatsCard
            title="This Week"
            value={`₹${stats.weekRevenue.toLocaleString()}`}
            subtitle={`${stats.weekOrders} orders`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            }
            color="secondary"
          />

          <StatsCard
            title="This Month"
            value={`₹${stats.monthRevenue.toLocaleString()}`}
            subtitle={`${stats.monthOrders} orders`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            }
            color="success"
          />

          <StatsCard
            title="Total Customers"
            value={stats.totalCustomers.toLocaleString()}
            subtitle="Unique customers"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            }
            color="info"
          />
        </div>

        {/* Popular Items */}
        <div className="popular-items-section">
          <div className="section-card">
            <h2 className="section-title">Popular Items</h2>
            <div className="popular-items-list">
              {stats.popularItems.length > 0 ? (
                stats.popularItems.map((item, index) => (
                  <div key={index} className="popular-item">
                    <div className="item-info">
                      <span className="item-rank">#{index + 1}</span>
                      <div className="item-details">
                        <h4 className="item-name">{item.name}</h4>
                        <p className="item-stats">{item.count} orders • ₹{item.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="item-revenue">
                      <span className="revenue-amount">₹{item.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data">No items sold yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <div className="section-card">
            <h2 className="section-title">Quick Actions</h2>
            <div className="quick-actions-grid">
              <button className="quick-action-btn" onClick={() => window.location.href = '/manage/orders'}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                View Orders
              </button>
              <button className="quick-action-btn" onClick={() => window.location.href = '/manage/menu'}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
                Manage Menu
              </button>
              <button className="quick-action-btn" onClick={() => window.location.href = '/manage/settings'}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;