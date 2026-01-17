import { db } from '../firebase';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { Order, Restaurant, CustomerInfo, OrderItem, DeliveryRoute } from '../types/Order';

export const createTestRestaurant = async (): Promise<void> => {
  try {
    const testRestaurant: Restaurant = {
      id: 'test-restaurant-123',
      ownerId: 'test-owner-123',
      restaurantInfo: {
        name: 'Test Restaurant',
        address: '123 Test Street, Test City',
        phone: '+1234567890',
        email: 'test@fast7.com',
        totalSalesDone: 0,
        coordinates: {
          lat: 28.6139,
          lng: 77.2090
        }
      },
      menuSelections: {
        standardItems: {},
        customItems: {}
      },
      orderingEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'restaurants', testRestaurant.id), testRestaurant);
    console.log('Test restaurant created successfully');
  } catch (error) {
    console.error('Error creating test restaurant:', error);
    throw error;
  }
};

export const createTestOrders = async (): Promise<void> => {
  try {
    const testOrders: Order[] = [
      {
        id: 'order-1',
        restaurantId: 'test-restaurant-123',
        customer: {
          name: 'John Doe',
          phone: '+1234567890',
          email: 'john@example.com',
          address: '456 Customer Lane, Test City',
          coordinates: {
            lat: 28.6239,
            lng: 77.2190
          }
        },
        items: [
          {
            id: 'item-1',
            name: 'Masala Dosa',
            quantity: 2,
            price: 120,
            category: 'South Indian'
          },
          {
            id: 'item-2',
            name: 'Idli',
            quantity: 1,
            price: 80,
            category: 'South Indian'
          }
        ],
        total: 320,
        status: 'pending',
        pending: true,
        paymentStatus: 'paid',
        deliveryCoordinates: {
          lat: 28.6239,
          lng: 77.2190
        },
        estimatedDeliveryTime: 30,
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        updatedAt: new Date()
      },
      {
        id: 'order-2',
        restaurantId: 'test-restaurant-123',
        customer: {
          name: 'Jane Smith',
          phone: '+0987654321',
          email: 'jane@example.com',
          address: '789 Another Road, Test City',
          coordinates: {
            lat: 28.6039,
            lng: 77.1990
          }
        },
        items: [
          {
            id: 'item-3',
            name: 'Pizza Margherita',
            quantity: 1,
            price: 350,
            category: 'Italian'
          }
        ],
        total: 390,
        status: 'delivering',
        pending: false,
        paymentStatus: 'paid',
        deliveryCoordinates: {
          lat: 28.6039,
          lng: 77.1990
        },
        estimatedDeliveryTime: 20,
        createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        updatedAt: new Date()
      },
      {
        id: 'order-3',
        restaurantId: 'test-restaurant-123',
        customer: {
          name: 'Bob Johnson',
          phone: '+1122334455',
          email: 'bob@example.com',
          address: '321 Final Street, Test City',
          coordinates: {
            lat: 28.6339,
            lng: 77.2290
          }
        },
        items: [
          {
            id: 'item-4',
            name: 'Tacos Al Pastor',
            quantity: 3,
            price: 180,
            category: 'Mexican'
          }
        ],
        total: 540,
        status: 'completed',
        pending: false,
        paymentStatus: 'paid',
        deliveryCoordinates: {
          lat: 28.6339,
          lng: 77.2290
        },
        estimatedDeliveryTime: 25,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date()
      }
    ];

    for (const order of testOrders) {
      await setDoc(doc(db, 'orders', order.id), order);
    }

    console.log('Test orders created successfully');
  } catch (error) {
    console.error('Error creating test orders:', error);
    throw error;
  }
};

export const createTestOrder = async (): Promise<Order> => {
  try {
    const orderId = `order-${Date.now()}`;
    const testOrder: Order = {
      id: orderId,
      restaurantId: 'test-restaurant-123',
      customer: {
        name: 'Test Customer',
        phone: '+1234567890',
        address: '123 Test Street, Test City',
        coordinates: {
          lat: 28.6139 + Math.random() * 0.01,
          lng: 77.2090 + Math.random() * 0.01
        }
      },
      items: [
        {
          id: 'test-item-1',
          name: 'Test Item',
          quantity: 1,
          price: 100,
          category: 'Test'
        }
      ],
      total: 100,
      status: 'delivering',
      pending: false,
      paymentStatus: 'paid',
      deliveryCoordinates: {
        lat: 28.6139 + Math.random() * 0.01,
        lng: 77.2090 + Math.random() * 0.01
      },
      estimatedDeliveryTime: 30,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'orders', orderId), testOrder);
    console.log('Test order created successfully:', orderId);
    return testOrder;
  } catch (error) {
    console.error('Error creating test order:', error);
    throw error;
  }
};

export const createAllTestData = async (): Promise<void> => {
  try {
    await createTestRestaurant();
    await createTestOrders();
    console.log('All test data created successfully');
  } catch (error) {
    console.error('Error creating test data:', error);
    throw error;
  }
};