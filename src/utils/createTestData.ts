import { db } from '../firebase';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { Order, Restaurant, CustomerInfo, OrderItem, DeliveryRoute } from '../types/Order';

export const createTestRestaurant = async (): Promise<void> => {
  try {
    const testRestaurant: Restaurant = {
      id: 'test-restaurant-123',
      name: 'Test Restaurant',
      ownerName: 'Test Owner',
      email: 'test@fast7.com',
      phone: '+1234567890',
      address: '123 Test Street, Test City',
      location: {
        lat: 28.6139,
        lng: 77.2090,
        address: '123 Test Street, Test City'
      },
      cuisine: 'Multi-Cuisine',
      rating: 4.5,
      deliveryRadius: 10,
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
        customerId: 'customer-1',
        customerInfo: {
          name: 'John Doe',
          phone: '+1234567890',
          email: 'john@example.com',
          address: '456 Customer Lane, Test City',
          location: {
            lat: 28.6239,
            lng: 77.2190,
            address: '456 Customer Lane, Test City'
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
        totalAmount: 320,
        status: 'pending',
        paymentStatus: 'paid',
        orderType: 'delivery',
        deliveryInfo: {
          deliveryAddress: '456 Customer Lane, Test City',
          deliveryLocation: {
            lat: 28.6239,
            lng: 77.2190,
            address: '456 Customer Lane, Test City'
          },
          estimatedDeliveryTime: '30-45 mins',
          deliveryFee: 40
        },
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        updatedAt: new Date()
      },
      {
        id: 'order-2',
        restaurantId: 'test-restaurant-123',
        customerId: 'customer-2',
        customerInfo: {
          name: 'Jane Smith',
          phone: '+0987654321',
          email: 'jane@example.com',
          address: '789 Another Road, Test City',
          location: {
            lat: 28.6039,
            lng: 77.1990,
            address: '789 Another Road, Test City'
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
        totalAmount: 390,
        status: 'delivering',
        paymentStatus: 'paid',
        orderType: 'delivery',
        deliveryInfo: {
          deliveryAddress: '789 Another Road, Test City',
          deliveryLocation: {
            lat: 28.6039,
            lng: 77.1990,
            address: '789 Another Road, Test City'
          },
          estimatedDeliveryTime: '20-30 mins',
          deliveryFee: 40,
          deliveryRoute: {
            distance: 5.2,
            duration: 15,
            steps: [
              'Head north on Test Street',
              'Turn right onto Customer Lane',
              'Destination on your left'
            ]
          }
        },
        createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        updatedAt: new Date()
      },
      {
        id: 'order-3',
        restaurantId: 'test-restaurant-123',
        customerId: 'customer-3',
        customerInfo: {
          name: 'Bob Johnson',
          phone: '+1122334455',
          email: 'bob@example.com',
          address: '321 Final Street, Test City',
          location: {
            lat: 28.6339,
            lng: 77.2290,
            address: '321 Final Street, Test City'
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
        totalAmount: 540,
        status: 'completed',
        paymentStatus: 'paid',
        orderType: 'delivery',
        deliveryInfo: {
          deliveryAddress: '321 Final Street, Test City',
          deliveryLocation: {
            lat: 28.6339,
            lng: 77.2290,
            address: '321 Final Street, Test City'
          },
          estimatedDeliveryTime: 'Delivered',
          deliveryFee: 40,
          deliveryRoute: {
            distance: 6.8,
            duration: 20,
            steps: [
              'Head east on Main Street',
              'Turn left onto Final Street',
              'Destination on your right'
            ]
          }
        },
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

export const createTestOrder = async () => {
  try {
    const orderId = `order-${Date.now()}`;
    const testOrder = {
      id: orderId,
      restaurantId: 'test-restaurant-123',
      customerId: `customer-${Date.now()}`,
      customer: {
        name: 'Test Customer',
        phone: '+1234567890',
        address: '123 Test Street, Test City',
        coordinates: {
          lat: 28.6139 + Math.random() * 0.01,
          lng: 77.2090 + Math.random() * 0.01,
          address: '123 Test Street, Test City'
        }
      },
      items: [
        {
          name: 'Test Item',
          quantity: 1,
          price: 100
        }
      ],
      total: 100,
      status: 'delivering',
      createdAt: new Date(),
      updatedAt: new Date(),
      deliveryPartnerName: 'Test Driver',
      deliveryPartnerPhone: '+1234567890',
      deliveryPartnerLocation: {
        lat: 28.6139,
        lng: 77.2090
      }
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