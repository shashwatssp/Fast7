import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { olaMapsService, RoutePoint } from '../../utils/olaMapsService';
import './OrderMap.css';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface OrderMapProps {
  restaurantAddress: string;
  deliveryAddress: string;
  orderId: string;
  customerName: string;
  deliveryCoordinates?: RoutePoint;
  onClose: () => void;
}

interface RouteData {
  distance: number; // in meters
  duration: number; // in seconds
  polyline: [number, number][];
  steps?: Array<{
    instruction: string;
    distance: number;
    duration: number;
  }>;
}

// Component to fit map bounds
function MapBounds({ origin, destination }: { origin: RoutePoint; destination: RoutePoint }) {
  const map = useMap();
  
  useEffect(() => {
    if (origin && destination) {
      const bounds = L.latLngBounds([origin.lat, origin.lng], [destination.lat, destination.lng]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, origin, destination]);

  return null;
}

const OrderMap: React.FC<OrderMapProps> = ({
  restaurantAddress,
  deliveryAddress,
  orderId,
  customerName,
  deliveryCoordinates,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restaurantLocation, setRestaurantLocation] = useState<RoutePoint | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<RoutePoint | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRouteData = async () => {
      setLoading(true);
      setError(null);
      setGeocodingError(null);

      try {
        console.log('OrderMap: Fetching route data', { 
          restaurantAddress, 
          deliveryAddress, 
          hasCoordinates: !!deliveryCoordinates 
        });

        // Use stored coordinates if available, otherwise geocode
        let deliveryCoords: RoutePoint | null = null;
        
        if (deliveryCoordinates) {
          console.log('Using stored coordinates:', deliveryCoordinates);
          deliveryCoords = deliveryCoordinates;
        } else {
          console.log('Geocoding delivery address:', deliveryAddress);
          deliveryCoords = await olaMapsService.geocodeAddress(deliveryAddress);
        }

        // Always geocode restaurant address (it should be stable)
        const restaurantCoords = await olaMapsService.geocodeAddress(restaurantAddress);

        if (!restaurantCoords) {
          setGeocodingError(`Could not find location for restaurant address: ${restaurantAddress}`);
          setLoading(false);
          return;
        }

        if (!deliveryCoords) {
          setGeocodingError(`Could not find location for delivery address: ${deliveryAddress}`);
          setLoading(false);
          return;
        }

        setRestaurantLocation(restaurantCoords);
        setDeliveryLocation(deliveryCoords);

        // Get route from Ola Maps
        try {
          const directions = await olaMapsService.getDirections(
            restaurantCoords,
            deliveryCoords,
            'driving'
          );

          if (directions.routes && directions.routes.length > 0) {
            const route = directions.routes[0];
            const polyline: [number, number][] = route.geometry.coordinates.map((coord: number[]) => [
              coord[1], // lat
              coord[0], // lng
            ]);

            setRouteData({
              distance: route.distance || 0,
              duration: route.duration || 0,
              polyline,
              steps: route.legs?.[0]?.steps?.map((step: any) => ({
                instruction: step.instruction || '',
                distance: step.distance || 0,
                duration: step.duration || 0,
              })),
            });
          } else {
            setError('No route found between locations');
          }
        } catch (apiError: any) {
          console.error('Ola Maps API error:', apiError);
          // Fallback: Show locations without route
          setError('Could not fetch route details. Showing locations only.');
        }
      } catch (err: any) {
        console.error('Error fetching route data:', err);
        setError(err.message || 'Failed to load map data');
      } finally {
        setLoading(false);
      }
    };

    fetchRouteData();
  }, [restaurantAddress, deliveryAddress]);

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="order-map-container">
        <div className="order-map-header">
          <h3>Delivery Route - Order #{orderId}</h3>
          <button className="close-map-btn" onClick={onClose}>×</button>
        </div>
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <p>Loading map and route...</p>
        </div>
      </div>
    );
  }

  if (geocodingError) {
    return (
      <div className="order-map-container">
        <div className="order-map-header">
          <h3>Delivery Route - Order #{orderId}</h3>
          <button className="close-map-btn" onClick={onClose}>×</button>
        </div>
        <div className="map-error">
          <p>⚠️ {geocodingError}</p>
          <p className="error-hint">Please ensure the addresses are complete and accurate.</p>
        </div>
      </div>
    );
  }

  if (!restaurantLocation || !deliveryLocation) {
    return (
      <div className="order-map-container">
        <div className="order-map-header">
          <h3>Delivery Route - Order #{orderId}</h3>
          <button className="close-map-btn" onClick={onClose}>×</button>
        </div>
        <div className="map-error">
          <p>Could not determine locations for the addresses provided.</p>
        </div>
      </div>
    );
  }

  const center: [number, number] = [
    (restaurantLocation.lat + deliveryLocation.lat) / 2,
    (restaurantLocation.lng + deliveryLocation.lng) / 2,
  ];

  return (
    <div className="order-map-container">
      <div className="order-map-header">
        <h3>Delivery Route - Order #{orderId}</h3>
        <button className="close-map-btn" onClick={onClose}>×</button>
      </div>

      <div className="route-metrics">
        {routeData && (
          <>
            <div className="metric-item">
              <span className="metric-label">Distance</span>
              <span className="metric-value">{formatDistance(routeData.distance)}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Estimated Time</span>
              <span className="metric-value">{formatDuration(routeData.duration)}</span>
            </div>
          </>
        )}
        {error && (
          <div className="metric-item error">
            <span className="metric-label">⚠️ {error}</span>
          </div>
        )}
      </div>

      <div className="map-wrapper">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapBounds origin={restaurantLocation} destination={deliveryLocation} />

          {/* Restaurant Marker */}
          <Marker position={[restaurantLocation.lat, restaurantLocation.lng]}>
            <Popup>
              <div className="marker-popup">
                <strong>📍 Restaurant</strong>
                <p>{restaurantAddress}</p>
              </div>
            </Popup>
          </Marker>

          {/* Delivery Location Marker */}
          <Marker position={[deliveryLocation.lat, deliveryLocation.lng]}>
            <Popup>
              <div className="marker-popup">
                <strong>🏠 Delivery Location</strong>
                <p><strong>Customer:</strong> {customerName}</p>
                <p>{deliveryAddress}</p>
              </div>
            </Popup>
          </Marker>

          {/* Route Polyline */}
          {routeData && routeData.polyline.length > 0 && (
            <Polyline
              positions={routeData.polyline}
              color="#ff5a60"
              weight={5}
              opacity={0.7}
            />
          )}
        </MapContainer>
      </div>

      {routeData?.steps && routeData.steps.length > 0 && (
        <div className="route-directions">
          <h4>Turn-by-Turn Directions</h4>
          <div className="directions-list">
            {routeData.steps.slice(0, 5).map((step, index) => (
              <div key={index} className="direction-step">
                <span className="step-number">{index + 1}</span>
                <span className="step-instruction">{step.instruction}</span>
                <span className="step-distance">{formatDistance(step.distance)}</span>
              </div>
            ))}
            {routeData.steps.length > 5 && (
              <p className="more-directions">+ {routeData.steps.length - 5} more steps</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderMap;
