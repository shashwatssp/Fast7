import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createTestOrder } from '../../utils/createTestData';

const OrderTrackingDemo: React.FC = () => {
  const [testOrders, setTestOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const generateTestOrder = async () => {
    setLoading(true);
    try {
      const testOrder = await createTestOrder();
      setTestOrders(prev => [...prev, testOrder]);
      console.log('Generated test order:', testOrder);
    } catch (error) {
      console.error('Error generating test order:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearOrders = () => {
    setTestOrders([]);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🚚 Order Tracking Demo</h1>
      <p>This page demonstrates the customer order tracking functionality.</p>
      
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h2>📋 How to Test:</h2>
        <ol style={{ lineHeight: '1.8' }}>
          <li>Click "Generate Test Order" to create a sample order</li>
          <li>Click "Track Order" to see the live tracking interface</li>
          <li>The tracking page will show:
            <ul>
              <li>📍 Live delivery partner location</li>
              <li>⏱️ Estimated delivery time</li>
              <li>🗺️ Route visualization on map</li>
              <li>🔔 Arrival notifications</li>
              <li>📊 Real-time status updates</li>
            </ul>
          </li>
        </ol>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={generateTestOrder}
          disabled={loading}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px',
            fontSize: '16px'
          }}
        >
          {loading ? 'Generating...' : '🎯 Generate Test Order'}
        </button>
        
        {testOrders.length > 0 && (
          <button
            onClick={clearOrders}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🗑️ Clear Orders
          </button>
        )}
      </div>

      {testOrders.length === 0 ? (
        <div style={{
          background: '#e9ecef',
          padding: '40px',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#6c757d'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <h3>No Test Orders Yet</h3>
          <p>Generate a test order to start tracking!</p>
        </div>
      ) : (
        <div>
          <h2>📦 Generated Test Orders</h2>
          {testOrders.map((order, index) => (
            <div
              key={order.id}
              style={{
                background: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0' }}>
                    Order #{order.id}
                  </h3>
                  <p style={{ margin: '0 0 4px 0', color: '#6c757d' }}>
                    <strong>Customer:</strong> {order.customer.name}
                  </p>
                  <p style={{ margin: '0 0 4px 0', color: '#6c757d' }}>
                    <strong>Address:</strong> {order.customer.address}
                  </p>
                  <p style={{ margin: '0 0 4px 0', color: '#6c757d' }}>
                    <strong>Total:</strong> ₹{order.total}
                  </p>
                  <p style={{ margin: '0', color: '#6c757d' }}>
                    <strong>Status:</strong> 
                    <span style={{
                      background: order.status === 'delivering' ? '#28a745' : '#ffc107',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      marginLeft: '8px',
                      fontSize: '12px'
                    }}>
                      {order.status.toUpperCase()}
                    </span>
                  </p>
                </div>
                
                <Link
                  to={`/track/${order.id}`}
                  style={{
                    background: '#28a745',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    display: 'inline-block',
                    fontWeight: 'bold'
                  }}
                >
                  🚀 Track Order
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        background: '#d1ecf1',
        border: '1px solid #bee5eb',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '20px'
      }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#0c5460' }}>💡 Pro Tip:</h3>
        <p style={{ margin: 0, color: '#0c5460' }}>
          Open the tracking link on your mobile device to test the responsive design and notification features!
        </p>
      </div>
    </div>
  );
};

export default OrderTrackingDemo;