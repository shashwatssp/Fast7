/**
 * Ola Maps API Service
 * Handles API calls to Ola Maps via Netlify Functions
 * This keeps API credentials secure on the server side
 */

interface RoutePoint {
  lat: number;
  lng: number;
}

interface DirectionsResponse {
  routes: Array<{
    geometry: {
      coordinates: number[][];
    };
    distance: number;
    duration: number;
    legs: Array<{
      distance: number;
      duration: number;
      steps: Array<{
        distance: number;
        duration: number;
        instruction: string;
      }>;
    }>;
  }>;
}

interface DistanceMatrixResponse {
  rows: Array<{
    elements: Array<{
      distance: {
        value: number;
        text: string;
      };
      duration: {
        value: number;
        text: string;
      };
      status: string;
    }>;
  }>;
}

class OlaMapsService {
  private readonly functionBaseUrl: string;

  constructor() {
    // Use Netlify Function endpoint
    this.functionBaseUrl = '/.netlify/functions/ola-maps-proxy';
    
    console.info('✅ Ola Maps Service initialized with secure Netlify Function proxy');
  }

  /**
   * Get directions between two points
   */
  async getDirections(
    origin: RoutePoint,
    destination: RoutePoint,
    mode: string = 'driving'
  ): Promise<DirectionsResponse> {
    try {
      const params = new URLSearchParams({
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        mode: mode,
      });

      const response = await fetch(
        `${this.functionBaseUrl}?path=/routing/v1/directions&${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Directions API failed: ${response.statusText} - ${errorData.error || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting directions:', error);
      throw error;
    }
  }

  /**
   * Get distance matrix for multiple origins and destinations
   */
  async getDistanceMatrix(
    origins: RoutePoint[],
    destinations: RoutePoint[]
  ): Promise<DistanceMatrixResponse> {
    try {
      const originStr = origins.map(p => `${p.lat},${p.lng}`).join('|');
      const destStr = destinations.map(p => `${p.lat},${p.lng}`).join('|');

      const params = new URLSearchParams({
        origins: originStr,
        destinations: destStr,
      });

      const response = await fetch(
        `${this.functionBaseUrl}?path=/routing/v1/distanceMatrix&${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Distance Matrix API failed: ${response.statusText} - ${errorData.error || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting distance matrix:', error);
      throw error;
    }
  }

  /**
   * Geocode an address to coordinates with fallback
   * Note: Ola Maps may not have a direct geocoding API, so we'll use a fallback
   * For production, consider using a geocoding service like Google Geocoding API
   */
  async geocodeAddress(address: string): Promise<RoutePoint | null> {
    // Fallback: Use a simple geocoding service or browser geocoding
    // For now, we'll return null and let the component handle geocoding
    // In production, integrate with a proper geocoding service
    try {
      // Using OpenStreetMap Nominatim as a fallback (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'Fast7-Restaurant-App',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }

      // If no results found, use fallback coordinates based on address patterns
      console.warn(`Could not geocode address: "${address}". Using fallback coordinates.`);
      return this.getFallbackCoordinates(address);
    } catch (error) {
      console.error('Error geocoding address:', error);
      console.warn(`Using fallback coordinates for address: "${address}"`);
      return this.getFallbackCoordinates(address);
    }
  }

  /**
   * Get fallback coordinates for addresses that can't be geocoded
   */
  private getFallbackCoordinates(address: string): RoutePoint {
    // Default fallback coordinates (India - central location)
    const defaultFallback: RoutePoint = { lat: 26.8467, lng: 80.9462 }; // Lucknow, India
    
    // Region-specific fallbacks based on address patterns
    const addressLower = address.toLowerCase();
    
    // Uttar Pradesh fallbacks
    if (addressLower.includes('uttar pradesh') || addressLower.includes('up')) {
      if (addressLower.includes('lucknow')) return { lat: 26.8467, lng: 80.9462 };
      if (addressLower.includes('kanpur')) return { lat: 26.4499, lng: 80.3319 };
      if (addressLower.includes('varanasi')) return { lat: 25.3176, lng: 82.9739 };
      if (addressLower.includes('agra')) return { lat: 27.1767, lng: 78.0081 };
      if (addressLower.includes('allahabad') || addressLower.includes('prayagraj')) return { lat: 25.4358, lng: 81.8463 };
    }
    
    // Bihar fallbacks
    if (addressLower.includes('bihar')) {
      if (addressLower.includes('patna')) return { lat: 25.5941, lng: 85.1376 };
      if (addressLower.includes('gaya')) return { lat: 24.7924, lng: 85.0017 };
    }
    
    // Delhi fallbacks
    if (addressLower.includes('delhi') || addressLower.includes('new delhi')) {
      return { lat: 28.6139, lng: 77.2090 };
    }
    
    // Maharashtra fallbacks
    if (addressLower.includes('maharashtra') || addressLower.includes('mumbai')) {
      return { lat: 19.0760, lng: 72.8777 };
    }
    
    // West Bengal fallbacks
    if (addressLower.includes('west bengal') || addressLower.includes('kolkata')) {
      return { lat: 22.5726, lng: 88.3639 };
    }
    
    // Tamil Nadu fallbacks
    if (addressLower.includes('tamil nadu') || addressLower.includes('chennai')) {
      return { lat: 13.0827, lng: 80.2707 };
    }
    
    // Karnataka fallbacks
    if (addressLower.includes('karnataka') || addressLower.includes('bangalore') || addressLower.includes('bengaluru')) {
      return { lat: 12.9716, lng: 77.5946 };
    }
    
    // Rajasthan fallbacks
    if (addressLower.includes('rajasthan')) {
      if (addressLower.includes('jaipur')) return { lat: 26.9124, lng: 75.7873 };
      if (addressLower.includes('udaipur')) return { lat: 24.5854, lng: 73.7125 };
    }
    
    // Gujarat fallbacks
    if (addressLower.includes('gujarat')) {
      if (addressLower.includes('ahmedabad')) return { lat: 23.0225, lng: 72.5714 };
      if (addressLower.includes('surat')) return { lat: 21.1702, lng: 72.8311 };
    }
    
    // Punjab fallbacks
    if (addressLower.includes('punjab')) {
      if (addressLower.includes('amritsar')) return { lat: 31.6340, lng: 74.8723 };
      if (addressLower.includes('ludhiana')) return { lat: 30.9010, lng: 75.8573 };
    }
    
    // Haryana fallbacks
    if (addressLower.includes('haryana')) {
      if (addressLower.includes('gurugram') || addressLower.includes('gurgaon')) return { lat: 28.4595, lng: 77.0266 };
      if (addressLower.includes('faridabad')) return { lat: 28.4089, lng: 77.3178 };
    }
    
    // If no specific match, return default fallback
    console.log(`Using default fallback coordinates for: "${address}"`);
    return defaultFallback;
  }
}

// Export singleton instance
export const olaMapsService = new OlaMapsService();
export type { RoutePoint, DirectionsResponse, DistanceMatrixResponse };
