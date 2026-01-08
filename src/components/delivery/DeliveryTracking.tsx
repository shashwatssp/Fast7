import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { olaMapsService, RoutePoint } from '../../utils/olaMapsService';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './DeliveryTracking.css';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Restaurant marker icon
const restaurantIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Delivery location marker icon
const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Driver/current location marker icon
const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface DeliveryTrackingProps {
  orderId: string;
  restaurantId: string;
}

interface OrderData {
  id: string;
  customer: {
    name: string;
    address: string;
    coordinates?: RoutePoint;
  };
  restaurantId: string;
  status?: 'preparing' | 'out_for_delivery' | 'delivered';
  driverLocation?: RoutePoint;
}

// Component to fit map bounds
function MapBounds({ points }: { points: RoutePoint[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, points]);

  return null;
}

const DeliveryTracking: React.FC<DeliveryTrackingProps> = ({ orderId, restaurantId }) => {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [restaurantLocation, setRestaurantLocation] = useState<RoutePoint | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<RoutePoint | null>(null);
  const [driverLocation, setDriverLocation] = useState<RoutePoint | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [distanceRemaining, setDistanceRemaining] = useState<number>(0);
  const [etaMinutes, setEtaMinutes] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch restaurant location
  useEffect(() => {
    const fetchRestaurantLocation = async () => {
      try {
        const restaurantRef = doc(db, 'restaurants', restaurantId);
        const restaurantDoc = await getDoc(restaurantRef);
        
        if (restaurantDoc.exists()) {
          const restaurantData = restaurantDoc.data();
          const address = restaurantData.restaurantInfo?.address;
          
          if (address) {
            const coords = await olaMapsService.geocodeAddress(address);
            if (coords) {
              setRestaurantLocation(coords);
              console.log('Restaurant location:', coords);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching restaurant location:', err);
      }
    };

    if (restaurantId) {
      fetchRestaurantLocation();
    }
  }, [restaurantId]);

  // Listen to order updates
  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('id', '==', orderId));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty) {
        const orderDoc = snapshot.docs[0];
        const orderData = { id: orderDoc.id, ...orderDoc.data() } as OrderData;
        setOrder(orderData);

        // Set delivery location
        if (orderData.customer?.coordinates) {
          setDeliveryLocation(orderData.customer.coordinates);
        } else if (orderData.customer?.address) {
          const coords = await olaMapsService.geocodeAddress(orderData.customer.address);
          if (coords) {
            setDeliveryLocation(coords);
          }
        }

        // Set driver location if available
        if (orderData.driverLocation) {
          setDriverLocation(orderData.driverLocation);
        }
      }
    }, (err) => {
      console.error('Error listening to order updates:', err);
      setError('Failed to load order data');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  // Calculate route and update distance/ETA
  useEffect(() => {
    const calculateRoute = async () => {
      if (!restaurantLocation || !deliveryLocation) return;

      const origin = driverLocation || restaurantLocation;
      
      try {
        const directions = await olaMapsService.getDirections(origin, deliveryLocation, 'driving');
        
        if (directions.routes && directions.routes.length > 0) {
          const route = directions.routes[0];
          const distance = route.distance || 0; // in meters
          const duration = route.duration || 0; // in seconds
          
          setDistanceRemaining(distance);
          setEtaMinutes(Math.round(duration / 60));
          
          const polyline: [number, number][] = route.geometry.coordinates.map((coord: number[]) => [
            coord[1], // lat
            coord[0], // lng
          ]);
          
          setRouteData({
            polyline,
            distance,
            duration,
          });
        }
      } catch (err) {
        console.error('Error calculating route:', err);
      }
    };

    calculateRoute();
  }, [restaurantLocation, deliveryLocation, driverLocation]);

  // Simulate driver movement (in production, this would come from real GPS updates)
  useEffect(() => {
    if (order?.status === 'out_for_delivery' && deliveryLocation && restaurantLocation) {
      // Simulate driver moving from restaurant to delivery location
      let currentLat = restaurantLocation.lat;
      let currentLng = restaurantLocation.lng;
      const targetLat = deliveryLocation.lat;
      const targetLng = deliveryLocation.lng;
      
      const steps = 100;
      let step = 0;
      
      intervalRef.current = setInterval(() => {
        if (step < steps) {
          const progress = step / steps;
          currentLat = restaurantLocation.lat + (targetLat - restaurantLocation.lat) * progress;
          currentLng = restaurantLocation.lng + (targetLng - restaurantLocation.lng) * progress;
          
          setDriverLocation({ lat: currentLat, lng: currentLng });
          step++;
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      }, 2000); // Update every 2 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [order?.status, deliveryLocation, restaurantLocation]);

  useEffect(() => {
    if (restaurantLocation && deliveryLocation) {
      setLoading(false);
    }
  }, [restaurantLocation, deliveryLocation]);

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="delivery-tracking-container">
        <div className="delivery-loading">
          <div className="loading-spinner-large"></div>
          <p>Loading delivery tracking...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="delivery-tracking-container">
        <div className="delivery-error">
          <p>⚠️ {error || 'Order not found'}</p>
        </div>
      </div>
    );
  }

  const mapCenter: [number, number] = driverLocation 
    ? [driverLocation.lat, driverLocation.lng]
    : restaurantLocation 
    ? [restaurantLocation.lat, restaurantLocation.lng]
    : [20.5937, 78.9629];

  const mapPoints = [
    restaurantLocation,
    deliveryLocation,
    driverLocation,
  ].filter(Boolean) as RoutePoint[];

  return (
    <div className="delivery-tracking-container">
      <div className="delivery-header">
        <h2>🚚 Order #{order.id}</h2>
        <div className="order-status-badge">
          {order.status === 'preparing' && '🍳 Preparing'}
          {order.status === 'out_for_delivery' && '🚚 Out for Delivery'}
          {order.status === 'delivered' && '✅ Delivered'}
        </div>
      </div>

      <div className="delivery-stats">
        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <div className="stat-label">Distance Remaining</div>
            <div className="stat-value">{formatDistance(distanceRemaining)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-label">Estimated Time</div>
            <div className="stat-value">{formatTime(etaMinutes)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div className="stat-content">
            <div className="stat-label">Customer</div>
            <div className="stat-value-small">{order.customer?.name || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div className="delivery-map-wrapper">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {mapPoints.length > 0 && <MapBounds points={mapPoints} />}

          {/* Restaurant Marker */}
          {restaurantLocation && (
            <Marker position={[restaurantLocation.lat, restaurantLocation.lng]} icon={restaurantIcon}>
              <Popup>
                <div className="marker-popup">
                  <strong>📍 Restaurant</strong>
                  <p>Starting point</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Delivery Location Marker */}
          {deliveryLocation && (
            <Marker position={[deliveryLocation.lat, deliveryLocation.lng]} icon={deliveryIcon}>
              <Popup>
                <div className="marker-popup">
                  <strong>🏠 Delivery Location</strong>
                  <p><strong>Customer:</strong> {order.customer?.name}</p>
                  <p>{order.customer?.address}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Driver Location Marker */}
          {driverLocation && order.status === 'out_for_delivery' && (
            <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
              <Popup>
                <div className="marker-popup">
                  <strong>🚚 Driver Location</strong>
                  <p>Current position</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Route Polyline */}
          {routeData && routeData.polyline && routeData.polyline.length > 0 && (
            <Polyline
              positions={routeData.polyline}
              color="#ff5a60"
              weight={5}
              opacity={0.7}
            />
          )}
        </MapContainer>
      </div>

      <div className="delivery-info">
        <div className="info-section">
          <h3>Delivery Details</h3>
          <p><strong>Order ID:</strong> {order.id}</p>
          <p><strong>Customer:</strong> {order.customer?.name}</p>
          <p><strong>Address:</strong> {order.customer?.address}</p>
          <p><strong>Status:</strong> {
            order.status === 'preparing' ? '🍳 Preparing your order' :
            order.status === 'out_for_delivery' ? '🚚 On the way' :
            order.status === 'delivered' ? '✅ Delivered' :
            'Pending'
          }</p>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTracking;
