# 🍕 Fast7 - Restaurant Management & Delivery System

<div align="center">

![Fast7 Logo](https://img.shields.io/badge/Fast7-⚡-FF6B35?style=for-the-badge&logo=food&logoColor=white)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.6.0-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.0-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

*A comprehensive restaurant management and delivery tracking system built with modern web technologies.*

[🚀 Live Demo](https://fast7.netlify.app) • [📖 Documentation](#documentation) • [🔧 Setup Guide](#installation)

</div>

## 📋 Table of Contents

- [🌟 Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [📦 Installation](#-installation)
- [🚀 Quick Start](#-quick-start)
- [📱 User Guides](#-user-guides)
- [🔧 Configuration](#-configuration)
- [🌐 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌟 Features

### 🏪 Restaurant Creation & Management
- **Multi-step Onboarding**: Guided setup process for new restaurants
- **Custom Domain Names**: Unique subdomains for each restaurant (e.g., `restaurant.fast7.netlify.app`)
- **Restaurant Profile**: Complete information management including bio, contact details, and location
- **Cover Photo Upload**: Visual branding with Cloudinary integration
- **Ordering Toggle**: Enable/disable online ordering as needed

### 📋 Menu Customization
- **Standard Categories**: Pre-built menu categories with common items
- **Custom Categories**: Create unique menu categories tailored to your restaurant
- **Item Management**: Add, edit, and remove menu items with pricing
- **Visual Menu**: Image support for menu items
- **Search & Filter**: Advanced menu search with price filtering
- **Real-time Updates**: Instant menu synchronization across all platforms

### 🛒 Order Management
- **Comprehensive Dashboard**: Real-time order tracking and management
- **Order Status Tracking**: 
  - 🟡 Pending - Awaiting confirmation
  - 🔵 Delivering - Out for delivery
  - 🟢 Completed - Successfully delivered
  - 🔴 Cancelled - Order cancelled
- **Advanced Filtering**: Filter by status, date range, and search terms
- **Order Analytics**: Revenue tracking and order statistics
- **Detailed Order Views**: Complete order information with customer details

### 📦 Order Placing System
- **Customer-Friendly Interface**: Intuitive ordering experience
- **Smart Cart**: Add/remove items with quantity management
- **Real-time Pricing**: Dynamic total calculation
- **Customer Information**: Secure data collection for delivery
- **Order Confirmation**: Instant confirmation with tracking details

### 🚚 Delivery & Tracking
- **Real-time GPS Tracking**: Live delivery partner location
- **Interactive Maps**: Visual route tracking with Leaflet.js
- **ETA Calculations**: Accurate delivery time estimates
- **Route Optimization**: Efficient delivery path planning
- **Delivery Partner Management**: Assign and track delivery personnel
- **Status Updates**: Real-time delivery status notifications

### 🗺️ Maps Integration
- **Ola Maps API**: Professional mapping and routing services
- **Geocoding Services**: Address to coordinate conversion
- **Route Visualization**: Interactive route display
- **Location Picker**: Interactive map for address selection
- **Distance Calculation**: Accurate distance measurements
- **Fallback Systems**: Reliable location services with backup options

### 🔔 Notifications System
- **Browser Notifications**: Native browser push notifications
- **Order Status Updates**: Real-time status change alerts
- **Delivery Notifications**: Arrival and nearby alerts
- **Sound Notifications**: Audio alerts for important updates
- **Vibration Support**: Mobile device vibration alerts
- **Permission Management**: Smart notification permission handling

### 📊 Analytics & Insights
- **Sales Dashboard**: Comprehensive sales overview
- **Order Statistics**: Detailed order analytics
- **Revenue Tracking**: Financial performance monitoring
- **Customer Insights**: Order pattern analysis
- **Real-time Metrics**: Live dashboard updates

---

## 🏗️ Architecture

### Technology Stack

#### Frontend
- **React 19.0.0** - Modern UI framework with hooks and concurrent features
- **TypeScript 5.7.2** - Type-safe JavaScript development
- **Tailwind CSS 3.4.0** - Utility-first CSS framework for rapid styling
- **Vite 6.2.0** - Fast build tool and development server

#### Backend & Services
- **Firebase 11.6.0** - Backend-as-a-Service with:
  - Firestore Database - NoSQL real-time database
  - Firebase Authentication - User management
  - Firebase Hosting - Deployment platform
- **Netlify Functions** - Serverless functions for API proxy
- **Ola Maps API** - Professional mapping and routing services

#### Maps & Visualization
- **Leaflet.js 1.9.4** - Open-source JavaScript library for mobile-friendly interactive maps
- **React-Leaflet 5.0.0** - React components for Leaflet maps

#### Media & Storage
- **Cloudinary** - Cloud-based image and video management
- **React-Cloudinary** - React components for Cloudinary integration

#### UI Components
- **Lucide React 0.487.0** - Beautiful icon library
- **React Router DOM 7.4.1** - Client-side routing

### Project Structure

```
src/
├── components/
│   ├── manage/                 # Restaurant management dashboard
│   │   ├── pages/             # Dashboard pages
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── OrdersPage.tsx
│   │   │   ├── MenuPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── shared/            # Shared components
│   │   └── RestaurantManagement.tsx
│   ├── customer/              # Customer-facing components
│   │   ├── OrderTracking.tsx
│   │   └── OrderTrackingDemo.tsx
│   ├── delivery/              # Delivery tracking components
│   │   └── DeliveryTracking.tsx
│   ├── website/               # Restaurant website components
│   │   ├── RestaurantPage.tsx
│   │   └── LocationPicker.tsx
│   ├── RestaurantOnboarding.tsx
│   ├── MenuSelectionStep.tsx
│   └── HomePage.tsx
├── utils/                     # Utility functions and services
│   ├── olaMapsService.ts      # Maps integration
│   ├── notificationService.ts # Notification management
│   ├── deliveryTrackingService.ts
│   └── cloudinary.ts          # Media management
├── types/                     # TypeScript type definitions
│   ├── Order.ts
│   └── Menu.ts
├── auth/                      # Authentication context
│   └── AuthContext.tsx
└── firebase.ts                # Firebase configuration
```

---

## 📦 Installation

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager
- Git for version control

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/fast7-restaurant-system.git
cd fast7-restaurant-system
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Configuration

Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Ola Maps Configuration
VITE_OLA_MAPS_API_KEY=your_ola_maps_api_key
```

### Step 4: Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Authentication
4. Configure your web app
5. Copy the configuration to your `.env` file

### Step 5: Cloudinary Setup

1. Create a Cloudinary account at [Cloudinary Console](https://cloudinary.com/)
2. Create an upload preset for restaurant images
3. Add your cloud name and upload preset to `.env`

---

## 🚀 Quick Start

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

---

## 📱 User Guides

### 🏪 For Restaurant Owners

#### 1. Restaurant Registration

1. **Domain Selection**: Choose a unique domain name for your restaurant
2. **Basic Information**: Fill in restaurant details, contact information, and address
3. **Menu Setup**: Select from standard categories or create custom ones
4. **Menu Items**: Add your menu items with descriptions and prices
5. **Launch**: Go live with your restaurant website

#### 2. Dashboard Management

- **Dashboard Overview**: Monitor orders, revenue, and performance
- **Order Management**: View, update, and manage incoming orders
- **Menu Management**: Update menu items and pricing
- **Settings**: Configure restaurant preferences and delivery options

#### 3. Order Processing

1. **Receive Orders**: New orders appear in real-time on your dashboard
2. **Confirm Orders**: Review and confirm customer orders
3. **Start Delivery**: Assign orders to delivery partners
4. **Track Progress**: Monitor delivery progress in real-time
5. **Complete Orders**: Mark orders as delivered

### 🛒 For Customers

#### 1. Browsing & Ordering

1. **Visit Restaurant**: Navigate to `restaurant.fast7.netlify.app`
2. **Browse Menu**: Explore menu categories and items
3. **Add to Cart**: Select items and add to your cart
4. **Checkout**: Provide delivery information and confirm order
5. **Track Order**: Receive real-time tracking updates

#### 2. Order Tracking

- **Real-time Updates**: Track your order status in real-time
- **Live Maps**: Watch your delivery progress on interactive maps
- **ETA Monitoring**: Get accurate delivery time estimates
- **Notifications**: Receive browser notifications for status updates

### 🚚 For Delivery Partners

#### 1. Order Assignment

- **Receive Orders**: Get assigned orders through the delivery system
- **Route Planning**: View optimized delivery routes
- **Customer Information**: Access delivery details and contact information

#### 2. Delivery Tracking

- **GPS Tracking**: Real-time location sharing with customers
- **Status Updates**: Update delivery status at each step
- **Navigation**: Built-in navigation to customer locations

---

## 🔧 Configuration

### Firebase Configuration

#### Firestore Database Structure

```javascript
// Restaurants Collection
restaurants/
  {restaurantId}/
    domainName: string
    ownerId: string
    restaurantInfo: {
      name: string
      bio: string
      phone: string
      email: string
      address: string
      totalSalesDone: number
    }
    menuSelections: {
      standardCategories: Array
      standardItems: Object
      customCategories: Array
      customItems: Object
    }
    orderingEnabled: boolean
    createdAt: Timestamp

// Orders Collection
orders/
  {orderId}/
    id: string
    restaurantId: string
    customer: {
      name: string
      address: string
      coordinates: {
        lat: number
        lng: number
      }
      phone: string
    }
    items: Array<{
      name: string
      quantity: number
      price: number
    }>
    total: number
    status: 'pending' | 'delivering' | 'completed' | 'cancelled'
    createdAt: Timestamp
    updatedAt: Timestamp
```

### Maps Configuration

#### Ola Maps Integration

The system uses Ola Maps API for:

- **Geocoding**: Converting addresses to coordinates
- **Routing**: Calculating optimal delivery routes
- **Distance Matrix**: Calculating distances between multiple points
- **Directions**: Turn-by-turn navigation instructions

#### Fallback Systems

- **OpenStreetMap Nominatim**: Backup geocoding service
- **Regional Coordinates**: Fallback coordinates for major Indian cities
- **Error Handling**: Graceful degradation when services are unavailable

### Notification Configuration

#### Browser Notifications

Configure notification behavior:

```typescript
// Notification types
- Order status updates
- Delivery partner nearby
- Order arrival confirmation
- Payment confirmations
```

#### Sound Notifications

Custom notification sounds for different events:

- **Update**: General status changes
- **Nearby**: Delivery partner approaching
- **Arrival**: Order delivered

---

## 🌐 Deployment

### Netlify Deployment

#### 1. Prepare for Deployment

```bash
npm run build
```

#### 2. Netlify Configuration

Create `netlify.toml`:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  directory = "netlify/functions"
```

#### 3. Environment Variables

Set environment variables in Netlify dashboard:

- Firebase configuration
- Cloudinary settings
- Ola Maps API key

#### 4. Deploy

```bash
# Using Netlify CLI
npm install -g netlify-cli
netlify deploy --prod

# Or connect to Git repository for automatic deployments
```

### Custom Domain Setup

1. **Configure DNS**: Add CNAME record to point to Netlify
2. **SSL Certificate**: Automatic SSL provisioned by Netlify
3. **Subdomain Setup**: Configure restaurant subdomains

---

## 🔧 Advanced Configuration

### Performance Optimization

#### Code Splitting

```typescript
// Lazy loading components
const OrderTracking = lazy(() => import('./components/customer/OrderTracking'));
const RestaurantManagement = lazy(() => import('./components/manage/RestaurantManagement'));
```

#### Image Optimization

```typescript
// Cloudinary transformations
const optimizedImage = cloudinary.image
  .format('auto')
  .quality('auto')
  .crop('fill')
  .width(800)
  .height(600);
```

### Security Features

#### Input Validation

```typescript
// Sanitize user inputs
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
```

#### Firebase Security Rules

```javascript
// Firestore security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /restaurants/{restaurantId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }
    
    match /orders/{orderId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🤝 Contributing

We welcome contributions to the Fast7 project! Here's how you can help:

### Development Workflow

1. **Fork the Repository**: Create a personal fork
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Make Changes**: Implement your feature or bug fix
4. **Test Thoroughly**: Ensure all tests pass
5. **Submit Pull Request**: Create a detailed PR description

### Code Standards

- **TypeScript**: Use strict type checking
- **ESLint**: Follow linting rules
- **Prettier**: Use consistent code formatting
- **Comments**: Document complex logic
- **Tests**: Write unit tests for new features

### Commit Guidelines

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Code style changes
refactor: Code refactoring
test: Add tests
chore: Build process or auxiliary tool changes
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Fast7 Restaurant System

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **React Team** - For the amazing React framework
- **Firebase** - For the excellent backend services
- **Leaflet** - For the open-source mapping library
- **Tailwind CSS** - For the utility-first CSS framework
- **Cloudinary** - For the media management services
- **Ola Maps** - For the professional mapping APIs

---

<div align="center">

**Made with ❤️ by the Fast7 Team**

[⭐ Star this repo](https://github.com/yourusername/fast7-restaurant-system)

</div>
