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
- [🔍 SEO Optimization](#-seo-optimization)
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

### 🎨 Website Templates & Themes
- **6 Designer Themes**: `ember`, `verdant`, `midnight`, `coastal`, `royal`, and `saffron` — each a complete look for a storefront
- **Template Gallery**: browse all themes at `/templates` (or `/manage/templates` from the dashboard) with live previews rendered from sample data
- **One-Click Apply**: switch a website's theme from the dashboard — the change applies instantly to the live site
- **Template-Aware Rendering**: restaurant pages render per-theme colors, typography, and layout via CSS variants

### 🏪 Multi-Website Management
- **Multiple Websites per Account**: create and manage any number of restaurant websites from one login
- **Website Switcher**: the dashboard header lets you switch the active website when you own more than one
- **Active Website Persistence**: the last active website is remembered across sessions
- **New Website Button**: create additional websites directly from the dashboard

### 🩺 Order Status Consistency
- **Single Source of Truth**: `getEffectiveOrderStatus()` resolves exactly one authoritative status per order — an order can never read as "pending" and "delivered" at the same time
- **Legacy Flag Sync**: the older boolean `pending` field is kept in sync on every status write
- **Automatic Delivery Completion**: when a customer's tracking page reaches the destination, the delivery is recorded through a race-safe transaction (`delivering → completed` only), so dashboards always match what customers see

---

## 🔍 SEO Optimization

Fast7 restaurant websites are fully crawlable — including for crawlers that never run JavaScript.

### The challenge

Fast7 is a client-rendered React SPA. Modern search engines can execute JavaScript, but **social crawlers (Facebook, WhatsApp, X, iMessage) do not** — without server-side help they only ever saw the generic `index.html` defaults when a restaurant link was shared.

### The solution — Netlify Edge Function (free tier)

`netlify/edge-functions/seo.ts` runs at the CDN edge on every request and provides:

#### 1. Per-restaurant meta injection
When a restaurant page is served (`/{domain}` or the restaurant's own subdomain), the function replaces the sentinel-wrapped block in `index.html` (`<!-- fast7:seo --> … <!-- /fast7:seo -->`) with restaurant-specific tags:
- `<title>` and `<meta name="description">` from the restaurant's Firestore profile
- Open Graph tags (`og:title`, `og:description`, `og:type: restaurant.restaurant`, `og:url`, `og:image` from the cover photo)
- Twitter card tags (`summary_large_image`)
- `<link rel="canonical">` pointing at `/{domain}`
- `Restaurant` JSON-LD structured data (schema.org) with name, description, address, phone, and email — enabling rich results

Restaurant data is read through the Firestore REST API using the same public web API key the client app already uses, with a 60-second in-memory cache to keep edge requests fast and infrequent.

#### 2. Dynamic sitemap.xml
`/sitemap.xml` is generated at the edge: it lists the homepage and every live restaurant website, discovered from the `restaurants` collection (reserved routes like `/manage` are excluded). Cached for 60 seconds.

#### 3. robots.txt with Sitemap line
The static `robots.txt` is served as-is, with a `Sitemap: {origin}/sitemap.xml` line appended — using the correct absolute URL for whichever host the request came from.

### Safety guarantees (nothing can break)

| Guarantee | How |
|---|---|
| Site never breaks due to SEO | Every failure path returns the original downstream response untouched |
| No non-HTML damage | Only `GET` responses with `content-type: text/html` are ever modified — JS, CSS, images, and APIs pass through unread |
| Private routes stay private | `/manage`, `/onboarding`, `/track`, and other reserved routes never receive injected meta |
| No new credentials | Uses the same public Firebase web key already shipped in the client bundle |
| Sentinel fallback | If the sentinel block is missing, tags are inserted before `</head>` instead |

### Client-side SEO (as before)

On top of the server-side layer, `RestaurantPage.tsx` still manages runtime meta for browser sessions (title, description, OG tags, canonical, JSON-LD), and the static `index.html` block gives the landing page proper search/social defaults.

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
- **Netlify Edge Functions** - CDN-edge runtime for server-side SEO (per-restaurant meta, sitemap, robots.txt)
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
│   │   ├── shared/            # Shared components (incl. PageHeader w/ switcher)
│   │   ├── TemplateGallery.tsx    # Theme gallery with live preview
│   │   └── RestaurantManagement.tsx
│   ├── customer/              # Customer-facing components
│   │   ├── OrderTracking.tsx
│   │   └── OrderTrackingDemo.tsx
│   ├── delivery/              # Delivery tracking components
│   │   └── DeliveryTracking.tsx
│   ├── website/               # Restaurant website components
│   │   ├── RestaurantPage.tsx
│   │   ├── templates.ts       # Designer theme definitions + sample data
│   │   └── LocationPicker.tsx
│   ├── RestaurantOnboarding.tsx
│   ├── MenuSelectionStep.tsx
│   └── HomePage.tsx
├── utils/                     # Utility functions and services
│   ├── olaMapsService.ts      # Maps integration
│   ├── notificationService.ts # Notification management
│   ├── deliveryTrackingService.ts
│   ├── orderStatus.ts         # Single source of truth for order status
│   └── cloudinary.ts          # Media management
├── types/                     # TypeScript type definitions
│   ├── Order.ts
│   └── Menu.ts
├── auth/                      # Authentication context
│   └── AuthContext.tsx        # Multi-website auth + active restaurant
└── firebase.ts                # Firebase configuration

netlify/
├── edge-functions/seo.ts      # Server-side SEO (meta injection, sitemap, robots)
└── functions/ola-maps-proxy.cjs  # Maps API proxy

public/
└── robots.txt                 # Crawler rules + Sitemap line (edge-injected)
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

> **Edge functions**: the SEO edge function in `netlify/edge-functions/` is
> detected and deployed automatically — no extra configuration is required,
> and it runs on the Netlify free plan. Optionally set a `FIREBASE_API_KEY`
> environment variable; when unset it falls back to the public web key
> already used by the client app.

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
