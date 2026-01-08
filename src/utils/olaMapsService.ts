/**
 * Ola Maps API Service
 * Handles authentication and API calls to Ola Maps
 */

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

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
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.olamaps.io';

  constructor() {
    this.clientId = import.meta.env.VITE_OLA_MAPS_CLIENT_ID || '';
    this.clientSecret = import.meta.env.VITE_OLA_MAPS_CLIENT_SECRET || '';
    this.apiKey = import.meta.env.VITE_OLA_MAPS_API_KEY || '';

    const mask = (value: string) =>
      value ? `${value.slice(0, 4)}...${value.slice(-4)}` : 'missing';

    console.info('[OlaMaps] Env loaded', {
      apiKeyPresent: !!this.apiKey,
      apiKeyPreview: mask(this.apiKey),
      clientIdPresent: !!this.clientId,
      clientIdPreview: mask(this.clientId),
      clientSecretPresent: !!this.clientSecret,
    });

    // Only warn if truly no credentials are available
    const hasCredentials = this.apiKey || (this.clientId && this.clientSecret);
    if (!hasCredentials) {
      console.warn('⚠️ Ola Maps API credentials not configured. Please check your .env file and restart the dev server.');
    } else {
      console.info('✅ Ola Maps API credentials loaded successfully');
    }
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    // Check if token is still valid (with 5 minute buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 300000) {
      return this.accessToken;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'openid',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.statusText}`);
      }

      const data: OAuthTokenResponse = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('Error getting Ola Maps access token:', error);
      throw error;
    }
  }

  /**
   * Get authorization header
   */
  private async getAuthHeader(): Promise<string> {
    if (this.apiKey) {
      // Use API key method (simpler)
      return `Bearer ${this.apiKey}`;
    } else {
      // Use OAuth token
      const token = await this.getAccessToken();
      return `Bearer ${token}`;
    }
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
      const authHeader = await this.getAuthHeader();
      
      const params = new URLSearchParams({
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        mode: mode,
      });

      const response = await fetch(
        `${this.baseUrl}/routing/v1/directions?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Directions API failed: ${response.statusText} - ${errorText}`);
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
      const authHeader = await this.getAuthHeader();

      const originStr = origins.map(p => `${p.lat},${p.lng}`).join('|');
      const destStr = destinations.map(p => `${p.lat},${p.lng}`).join('|');

      const params = new URLSearchParams({
        origins: originStr,
        destinations: destStr,
      });

      const response = await fetch(
        `${this.baseUrl}/routing/v1/distanceMatrix?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Distance Matrix API failed: ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting distance matrix:', error);
      throw error;
    }
  }

  /**
   * Geocode an address to coordinates
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

      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }
}

// Export singleton instance
export const olaMapsService = new OlaMapsService();
export type { RoutePoint, DirectionsResponse, DistanceMatrixResponse };
