export interface CustomerInfo {
  name: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  phone?: string;
  email?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category?: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  customer: CustomerInfo;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'delivering' | 'completed' | 'cancelled';
  pending: boolean; // Legacy field for backward compatibility
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
  orderTime?: string; // ISO string for order time
  estimatedDeliveryTime?: number; // in minutes
  actualDeliveryTime?: number; // in minutes
  deliveryDistance?: number; // in meters
  deliveryCoordinates?: {
    lat: number;
    lng: number;
  };
  deliveryInstructions?: string;
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed';
}

export interface RestaurantInfo {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  totalSalesDone: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Restaurant {
  id: string;
  ownerId: string;
  restaurantInfo: RestaurantInfo;
  menuSelections: {
    standardItems: Record<string, any[]>;
    customItems: Record<string, any[]>;
  };
  coverPhoto?: string;
  orderingEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryRoute {
  distance: number; // in meters
  duration: number; // in seconds
  polyline: [number, number][];
  steps?: Array<{
    instruction: string;
    distance: number;
    duration: number;
  }>;
  estimatedTime?: number; // in minutes
}