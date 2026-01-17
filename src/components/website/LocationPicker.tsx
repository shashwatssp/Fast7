import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { olaMapsService, RoutePoint } from '../../utils/olaMapsService';
import './LocationPicker.css';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon for selected location
const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationPickerProps {
  onLocationSelect: (address: string, coordinates: RoutePoint) => void;
  initialAddress?: string;
  onClose?: () => void;
}

// Component to handle map clicks and center updates
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (coords: RoutePoint) => void }) {
  const map = useMap();

  useEffect(() => {
    const handleClick = async (e: L.LeafletMouseEvent) => {
      const coords: RoutePoint = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      };
      
      console.log('Map clicked at:', coords);
      
      // Reverse geocode to get address
      try {
        const address = await reverseGeocode(coords);
        console.log('Reverse geocoded address:', address);
        onLocationSelect(coords);
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        // Still allow selection even if reverse geocoding fails
        onLocationSelect(coords);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onLocationSelect]);

  return null;
}

// Component to update map center when mapCenter changes
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center);
  }, [center, map]);

  return null;
}

// Reverse geocode coordinates to address
async function reverseGeocode(coords: RoutePoint): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Fast7-Restaurant-App',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    if (data && data.display_name) {
      return data.display_name;
    }
    return `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
  }
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialAddress = '',
  onClose,
}) => {
  console.log('🗺️ LocationPicker component mounted with initialAddress:', initialAddress);
  
  const [address, setAddress] = useState(initialAddress);
  const [selectedCoords, setSelectedCoords] = useState<RoutePoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // Default: India
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time address autocomplete as user types
  useEffect(() => {
    if (address && address.length > 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('Searching for address:', address);
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=8&addressdetails=1&countrycodes=in`,
            {
              headers: {
                'User-Agent': 'Fast7-Restaurant-App',
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            console.log('Address suggestions found:', data.length);
            setSearchResults(data);
            setShowSearchResults(data.length > 0);
            
            // Auto-select if only one result and it's a good match
            if (data.length === 1 && address.length > 10) {
              const result = data[0];
              const matchScore = result.display_name.toLowerCase().includes(address.toLowerCase()) ? 1 : 0;
              if (matchScore > 0.8) {
                handleSelectSearchResult(result);
              }
            }
          }
        } catch (err) {
          console.error('Address search error:', err);
        }
      }, 300); // Reduced delay for faster response
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [address]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords: RoutePoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        console.log('Current location:', coords);

        setMapCenter([coords.lat, coords.lng]);
        setSelectedCoords(coords);

        // Reverse geocode to get address
        try {
          const addressText = await reverseGeocode(coords);
          setAddress(addressText);
          setError(null);
        } catch (err) {
          console.error('Reverse geocoding error:', err);
          setAddress(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
        }

        setGettingLocation(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Could not get your location. Please allow location access or enter address manually.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleAddressSearch = async () => {
    if (!address || address.trim().length < 5) {
      setError('Please enter a complete address (at least 5 characters)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const coords = await olaMapsService.geocodeAddress(address);
      
      if (coords) {
        console.log('Geocoded address:', address, 'to coordinates:', coords);
        setSelectedCoords(coords);
        setMapCenter([coords.lat, coords.lng]);
        setError(null);
      } else {
        setError('Could not find this address. Please try a more specific address or use "Get Current Location".');
      }
    } catch (err: any) {
      console.error('Geocoding error:', err);
      setError('Error validating address. Please try again or use "Get Current Location".');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSearchResult = async (result: { display_name: string; lat: string; lon: string }) => {
    const coords: RoutePoint = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };

    setAddress(result.display_name);
    setSelectedCoords(coords);
    setMapCenter([coords.lat, coords.lng]);
    setShowSearchResults(false);
    setError(null);
  };

  const handleMapLocationSelect = async (coords: RoutePoint) => {
    setSelectedCoords(coords);
    
    // Reverse geocode to update address
    try {
      const addressText = await reverseGeocode(coords);
      setAddress(addressText);
      setError(null);
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    }
  };

  const handleConfirm = () => {
    console.log('🔍 handleConfirm called with:', { selectedCoords, address });
    
    if (!selectedCoords) {
      console.log('❌ No coordinates selected');
      setError('Please select a location on the map or validate your address');
      return;
    }

    if (!address || address.trim().length < 5) {
      console.log('❌ Address too short:', address);
      setError('Please enter a complete address');
      return;
    }

    console.log('✅ Location confirmed:', { address, coordinates: selectedCoords });
    onLocationSelect(address, selectedCoords);
  };

  return (
    <div className="location-picker-container">
      <div className="location-picker-header">
        <h3>📍 Select Delivery Location</h3>
        {onClose && (
          <button className="close-location-picker" onClick={onClose}>×</button>
        )}
      </div>

      <div className="location-picker-content">
        <div className="location-input-section">
          <div className="address-input-group">
            <label htmlFor="delivery-address">Delivery Address *</label>
            <div className="address-input-wrapper">
              <input
                type="text"
                id="delivery-address"
                className="address-input"
                placeholder="Enter complete address (e.g., House number, Street, Area, City, State, PIN)"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setSelectedCoords(null); // Clear selection when typing
                  setError(null);
                  // Don't hide results, let them update
                }}
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowSearchResults(true);
                  }
                }}
                onBlur={() => {
                  // Delay hiding to allow click on suggestions
                  setTimeout(() => setShowSearchResults(false), 200);
                }}
              />
              {showSearchResults && searchResults.length > 0 && (
                <div className="address-suggestions">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleSelectSearchResult(result)}
                    >
                      <span className="suggestion-icon">📍</span>
                      <span className="suggestion-text">{result.display_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="address-actions">
              <button
                type="button"
                className="btn-get-location"
                onClick={handleGetCurrentLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? (
                  <>
                    <span className="spinner-small"></span>
                    Getting Location...
                  </>
                ) : (
                  <>
                    📍 Get Current Location
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn-validate-address"
                onClick={handleAddressSearch}
                disabled={loading || !address}
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Validating...
                  </>
                ) : (
                  '✓ Validate Address'
                )}
              </button>
            </div>
            {error && (
              <div className="location-error">
                ⚠️ {error}
              </div>
            )}
            {selectedCoords && (
              <div className="location-success">
                ✓ Location confirmed: {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
              </div>
            )}
          </div>

          <div className="location-instructions">
            <p><strong>Instructions:</strong></p>
            <ul>
              <li>Enter a complete address with house number, street, area, city, and PIN code</li>
              <li>Or click "Get Current Location" to use your device's GPS</li>
              <li>Or click on the map to select a location</li>
              <li>Make sure the address is validated (green checkmark) before proceeding</li>
            </ul>
          </div>
        </div>

        <div className="map-section">
          <div style={{ height: '400px', width: '100%', border: '2px solid red' }}>
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
            
            {selectedCoords && (
              <Marker position={[selectedCoords.lat, selectedCoords.lng]} icon={selectedIcon}>
              </Marker>
            )}

            <MapClickHandler onLocationSelect={handleMapLocationSelect} />
            <MapCenterUpdater center={mapCenter} />
          </MapContainer>
          </div>
        </div>
      </div>

      <div className="location-picker-footer">
        {onClose && (
          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          className="btn-confirm-location"
          onClick={handleConfirm}
          disabled={!selectedCoords || !address}
        >
          ✓ Confirm Location
        </button>
      </div>
    </div>
  );
};

export default LocationPicker;
