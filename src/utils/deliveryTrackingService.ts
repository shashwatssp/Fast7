import { Order } from '../types/Order';

// Define a compatible Order interface for the tracking service
interface TrackingOrder {
  id: string;
  restaurantId: string;
  status: string;
  restaurantLocation: { lat: number; lng: number };
  deliveryLocation: { lat: number; lng: number };
  customer: any;
  items: any[];
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryLocation {
  lat: number;
  lng: number;
  timestamp: number;
  speed?: number;
  heading?: number;
}

export interface TrackingUpdate {
  orderId: string;
  location: DeliveryLocation;
  estimatedArrival: number;
  distanceRemaining: number;
  status: string;
}

class DeliveryTrackingService {
  private activeTrackings: Map<string, NodeJS.Timeout> = new Map();
  private listeners: Map<string, (update: TrackingUpdate) => void> = new Map();

  /**
   * Start tracking a delivery order
   */
  startTracking(order: TrackingOrder, onUpdate: (update: TrackingUpdate) => void): void {
    if (!order.deliveryLocation || !order.restaurantLocation) {
      console.error('Cannot track order: missing location data');
      return;
    }

    const orderId = order.id;
    
    // Clear any existing tracking for this order first
    this.stopTracking(orderId);

    // Store the listener after clearing existing tracking
    this.listeners.set(orderId, onUpdate);

    // Calculate route and start simulation
    this.simulateDeliveryTracking(order);
  }

  /**
   * Stop tracking a delivery order
   */
  stopTracking(orderId: string): void {
    const tracking = this.activeTrackings.get(orderId);
    if (tracking) {
      clearInterval(tracking);
      this.activeTrackings.delete(orderId);
    }
    this.listeners.delete(orderId);
  }

  /**
   * Simulate realistic delivery partner movement
   */
  private simulateDeliveryTracking(order: TrackingOrder): void {
    const orderId = order.id;
    const listener = this.listeners.get(orderId);
    
    if (!listener || !order.deliveryLocation || !order.restaurantLocation) {
      return;
    }

    // Start position (restaurant)
    const startPos = {
      lat: order.restaurantLocation.lat,
      lng: order.restaurantLocation.lng
    };

    // End position (customer)
    const endPos = {
      lat: order.deliveryLocation.lat,
      lng: order.deliveryLocation.lng
    };

    // Calculate total distance and estimated time
    const totalDistance = this.calculateDistance(startPos, endPos);
    const estimatedDuration = this.calculateEstimatedDuration(totalDistance, order.status);
    
    // Current position starts at restaurant
    let currentPosition = { ...startPos };
    let progress = 0;
    let lastUpdate = Date.now();

    // Update interval (every 2 seconds for smooth tracking)
    const updateInterval = setInterval(() => {
      const now = Date.now();
      const deltaTime = (now - lastUpdate) / 1000; // Convert to seconds
      lastUpdate = now;

      // Calculate progress based on realistic movement
      progress = this.calculateProgress(progress, deltaTime, totalDistance, estimatedDuration);
      
      // Update position along the route
      currentPosition = this.interpolatePosition(startPos, endPos, progress);
      
      // Calculate remaining distance and ETA
      const distanceRemaining = totalDistance * (1 - progress);
      const timeRemaining = estimatedDuration * (1 - progress);
      const estimatedArrival = now + (timeRemaining * 1000);

      // Determine current status based on progress
      let currentStatus = order.status;
      if (progress < 0.1) {
        currentStatus = 'preparing';
      } else if (progress < 0.15) {
        currentStatus = 'ready';
      } else if (progress < 0.95) {
        currentStatus = 'delivering';
      } else {
        currentStatus = 'delivered';
      }

      // Create tracking update
      const update: TrackingUpdate = {
        orderId,
        location: {
          ...currentPosition,
          timestamp: now,
          speed: this.calculateSpeed(totalDistance, estimatedDuration),
          heading: this.calculateHeading(startPos, endPos)
        },
        estimatedArrival,
        distanceRemaining,
        status: currentStatus
      };

      // Send update to listener
      listener(update);

      // Stop tracking if delivered
      if (progress >= 1) {
        clearInterval(updateInterval);
        this.activeTrackings.delete(orderId);
        
        // Send final delivered update
        listener({
          ...update,
          status: 'delivered',
          distanceRemaining: 0,
          estimatedArrival: now
        });
      }
    }, 2000);

    this.activeTrackings.set(orderId, updateInterval);
  }

  /**
   * Calculate progress with realistic movement patterns
   */
  private calculateProgress(
    currentProgress: number, 
    deltaTime: number, 
    totalDistance: number, 
    estimatedDuration: number
  ): number {
    // Base speed (distance per second)
    const baseSpeed = totalDistance / estimatedDuration;
    
    // Add realistic variations (traffic, stops, etc.)
    let speedMultiplier = 1;
    
    // Simulate traffic conditions
    if (currentProgress > 0.2 && currentProgress < 0.4) {
      // Heavy traffic zone
      speedMultiplier = 0.6 + Math.random() * 0.3;
    } else if (currentProgress > 0.6 && currentProgress < 0.7) {
      // Moderate traffic
      speedMultiplier = 0.8 + Math.random() * 0.2;
    } else {
      // Normal traffic with small variations
      speedMultiplier = 0.9 + Math.random() * 0.2;
    }
    
    // Simulate occasional stops (traffic lights, etc.)
    if (Math.random() < 0.05) {
      speedMultiplier = 0;
    }
    
    // Calculate progress increment
    const progressIncrement = (baseSpeed * speedMultiplier * deltaTime) / totalDistance;
    
    // Ensure we don't exceed 100%
    return Math.min(currentProgress + progressIncrement, 1);
  }

  /**
   * Interpolate position between start and end points
   */
  private interpolatePosition(
    start: { lat: number; lng: number }, 
    end: { lat: number; lng: number }, 
    progress: number
  ): { lat: number; lng: number } {
    // Add slight curve to make route more realistic
    const curve = Math.sin(progress * Math.PI) * 0.02;
    
    return {
      lat: start.lat + (end.lat - start.lat) * progress + curve,
      lng: start.lng + (end.lng - start.lng) * progress + curve
    };
  }

  /**
   * Calculate distance between two points in kilometers
   */
  private calculateDistance(
    start: { lat: number; lng: number }, 
    end: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(end.lat - start.lat);
    const dLng = this.toRadians(end.lng - start.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(start.lat)) * Math.cos(this.toRadians(end.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate estimated delivery duration in seconds
   */
  private calculateEstimatedDuration(distance: number, status: string): number {
    // Base speed: 25 km/h in city traffic
    const baseSpeed = 25 / 3600; // km per second
    
    // Add preparation time if order is not ready
    let preparationTime = 0;
    if (status === 'preparing') {
      preparationTime = 10 * 60; // 10 minutes
    } else if (status === 'ready') {
      preparationTime = 2 * 60; // 2 minutes
    }
    
    // Calculate travel time with buffer
    const travelTime = (distance / baseSpeed) * 1.2; // 20% buffer for traffic
    
    return preparationTime + travelTime;
  }

  /**
   * Calculate current speed in km/h
   */
  private calculateSpeed(totalDistance: number, totalDuration: number): number {
    if (totalDuration === 0) return 0;
    return (totalDistance / totalDuration) * 3600; // Convert to km/h
  }

  /**
   * Calculate heading direction
   */
  private calculateHeading(
    start: { lat: number; lng: number }, 
    end: { lat: number; lng: number }
  ): number {
    const dLng = this.toRadians(end.lng - start.lng);
    const lat1 = this.toRadians(start.lat);
    const lat2 = this.toRadians(end.lat);
    
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - 
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    
    const heading = Math.atan2(y, x);
    return (this.toDegrees(heading) + 360) % 360;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Convert radians to degrees
   */
  private toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  /**
   * Get current tracking status for an order
   */
  getTrackingStatus(orderId: string): boolean {
    return this.activeTrackings.has(orderId);
  }

  /**
   * Stop all active tracking
   */
  stopAllTracking(): void {
    this.activeTrackings.forEach((tracking, orderId) => {
      clearInterval(tracking);
    });
    this.activeTrackings.clear();
    this.listeners.clear();
  }
}

// Export singleton instance
export const deliveryTrackingService = new DeliveryTrackingService();

// Types are already exported above