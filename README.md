# 🍽️ Fast7⚡ - Restaurant Management System

**Launch Your Restaurant Online in 7 Minutes!**

Fast7 is a comprehensive React application designed to help restaurant owners create stunning websites and manage their entire business operations in under 7 minutes. With a clean UI, mobile-first design, and powerful management features, Fast7 makes it easy to establish and manage your online presence.

---

## 📋 Table of Contents
1. [✨ Features](#-features)
2. [🛠️ Technologies Used](#️-technologies-used)
3. [🚀 Installation](#-installation)
4. [💻 Usage](#-usage)
5. [🏗️ Project Structure](#️-project-structure)
6. [🎯 Core Components](#-core-components)
7. [🔧 Configuration](#-configuration)
8. [📱 Mobile Responsiveness](#-mobile-responsiveness)
9. [🔐 Authentication](#-authentication)
10. [📊 Analytics & Reporting](#-analytics--reporting)
11. [🐛 Troubleshooting](#-troubleshooting)
12. [🤝 Contributing](#-contributing)
13. [📄 License](#-license)

---

## ✨ Features

### 🎨 **Customer-Facing Features**
- **Mobile-First Design**: Fully responsive and optimized for all devices
- **Beautiful Restaurant Websites**: Stunning templates with custom branding
- **Online Ordering**: Complete food ordering system with cart functionality
- **Order Tracking**: Real-time order status tracking for customers
- **Location Services**: Integrated maps for restaurant location and delivery tracking
- **Menu Display**: Interactive menu with categories, pricing, and availability

### 🏪 **Restaurant Management Features**
- **Dashboard Analytics**: Comprehensive overview of business performance
- **Order Management**: Complete order lifecycle management with status updates
- **Menu Management**: Full CRUD operations for menu items and categories
- **Settings & Configuration**: Customizable restaurant settings and preferences
- **Real-time Updates**: Live data synchronization across all devices
- **Delivery Tracking**: Built-in delivery partner integration and tracking

### ⚡ **Technical Features**
- **Lightning-Fast Development**: Built with Vite for instant hot reload
- **TypeScript Support**: Full type safety for better development experience
- **Firebase Integration**: Real-time database and authentication
- **Progressive Web App**: PWA capabilities for mobile app-like experience
- **SEO Optimized**: Built-in SEO optimization for better discoverability

---

## 🛠️ Technologies Used

### **Frontend Stack**
- **React 18** - Modern frontend framework with hooks
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS v3** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Firebase** - Real-time database and authentication

### **UI/UX Libraries**
- **Lucide React** - Beautiful icon library
- **Custom Components** - Reusable component library
- **CSS Animations** - Smooth transitions and micro-interactions

### **Development Tools**
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

---

## 🚀 Installation

### **Prerequisites**
- Node.js 16+ and npm
- Git for version control
- Firebase project (for backend services)

### **Step 1: Clone the Repository**
```bash
git clone https://github.com/shashwatssp/dash.git
cd dash
```

### **Step 2: Install Dependencies**
```bash
npm install
```

### **Step 3: Firebase Configuration**
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Google OAuth)
3. Set up Firestore Database
4. Copy your Firebase configuration
5. Replace the config in `src/firebase.ts`

### **Step 4: Start Development Server**
```bash
npm run dev
```

### **Step 5: Access the Application**
- **Local URL**: `http://localhost:5173`
- **Network URL**: Use the IP displayed in terminal for mobile testing

---

## 💻 Usage

### **Development Commands**
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### **Getting Started**
1. **Sign Up/In**: Use Google OAuth for quick authentication
2. **Restaurant Onboarding**: Complete your restaurant profile in minutes
3. **Setup Menu**: Add your menu items with categories and pricing
4. **Configure Settings**: Set delivery radius, timing, and preferences
5. **Launch**: Your restaurant website is ready to accept orders!

### **Management Dashboard**
Access the powerful restaurant management dashboard:
- **Dashboard**: Overview with analytics and quick stats
- **Orders**: Manage all incoming and past orders
- **Menu**: Add, edit, and remove menu items
- **Settings**: Configure restaurant operations

---

## 🏗️ Project Structure

```
src/
├── components/           # Reusable React components
│   ├── manage/          # Restaurant management components
│   │   ├── pages/       # Main management pages
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── OrdersPage.tsx
│   │   │   ├── MenuPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── shared/      # Shared management components
│   │   │   ├── PageHeader.tsx
│   │   │   └── StatsCard.tsx
│   │   ├── RestaurantManagement.tsx
│   │   └── EditMenuComponent.tsx
│   ├── customer/        # Customer-facing components
│   │   ├── OrderTracking.tsx
│   │   └── OrderTrackingDemo.tsx
│   ├── delivery/        # Delivery partner components
│   │   ├── DeliveryTracking.tsx
│   │   └── DeliveryTracking.css
│   └── website/         # Public website components
│       ├── RestaurantPage.tsx
│       └── LocationPicker.tsx
├── auth/                # Authentication context
│   └── AuthContext.tsx
├── types/               # TypeScript type definitions
│   ├── Order.ts
│   └── Menu.ts
├── utils/               # Utility functions
│   ├── firebase.ts
│   ├── notificationService.ts
│   └── deliveryTrackingService.ts
└── styles/              # Global styles
    ├── index.css
    └── App.css
```

---

## 🎯 Core Components

### **Management Pages**

#### **DashboardPage** (`src/components/manage/pages/DashboardPage.tsx`)
- Real-time business analytics
- Order statistics and trends
- Popular items and revenue insights
- Quick action buttons for common tasks

#### **OrdersPage** (`src/components/manage/pages/OrdersPage.tsx`)
- Complete order management system
- Filter by status, date, and search
- Real-time order status updates
- Detailed order modal views
- Order completion workflow

#### **MenuPage** (`src/components/manage/pages/MenuPage.tsx`)
- Full CRUD operations for menu items
- Category management
- Availability toggles
- Bulk operations support
- Rich item details (ingredients, dietary info, etc.)

#### **SettingsPage** (`src/components/manage/pages/SettingsPage.tsx`)
- Restaurant information management
- Operating hours and delivery settings
- Payment and pricing configuration
- Social media integration
- Export/import settings

### **Shared Components**

#### **PageHeader** (`src/components/manage/shared/PageHeader.tsx`)
- Consistent page headers across management pages
- Breadcrumb navigation
- Back button functionality
- Responsive design

#### **StatsCard** (`src/components/manage/shared/StatsCard.tsx`)
- Reusable statistics display cards
- Multiple color variants
- Trend indicators
- Click interactions

---

## 🔧 Configuration

### **Firebase Configuration**
```typescript
// src/firebase.ts
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### **Environment Variables**
Create a `.env.local` file for environment-specific settings:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_PROJECT_ID=your-project-id
```

### **Tailwind CSS Configuration**
The project uses Tailwind CSS v3 with custom configuration in `tailwind.config.js`:
- Custom color palette with primary brand color (#ff5a60)
- Responsive breakpoints
- Custom animations and transitions

---

## 📱 Mobile Responsiveness

### **Responsive Breakpoints**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### **Mobile Features**
- Touch-optimized interfaces
- Swipe gestures for navigation
- Mobile-first design approach
- Progressive Web App capabilities

### **Responsive Components**
- Collapsible navigation drawer
- Adaptive grid layouts
- Mobile-optimized forms
- Touch-friendly buttons and controls

---

## 🔐 Authentication

### **Google OAuth Integration**
- Seamless Google sign-in
- Secure token management
- Automatic session persistence
- Multi-device synchronization

### **User Roles**
- **Restaurant Owners**: Full management access
- **Delivery Partners**: Delivery-specific features
- **Customers**: Ordering and tracking capabilities

### **Security Features**
- Firebase Authentication integration
- Secure session management
- Role-based access control
- Data encryption in transit

---

## 📊 Analytics & Reporting

### **Dashboard Analytics**
- Real-time order statistics
- Revenue tracking and trends
- Popular items analysis
- Customer behavior insights

### **Order Analytics**
- Order status distribution
- Peak ordering times
- Delivery performance metrics
- Customer satisfaction tracking

### **Business Intelligence**
- Sales performance reports
- Menu item popularity
- Customer retention metrics
- Delivery efficiency analysis

---

## 🐛 Troubleshooting

### **Common Issues**

#### **Firebase Connection Issues**
```bash
# Check Firebase configuration
# Verify network connectivity
# Ensure Firebase rules allow access
```

#### **Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run lint
```

#### **Styling Issues**
```bash
# Verify Tailwind CSS build
# Check CSS imports
# Ensure responsive classes are applied
```

### **Performance Optimization**
- Use React.memo for expensive components
- Implement lazy loading for routes
- Optimize images and assets
- Enable production builds for deployment

---

## 🤝 Contributing

### **Development Guidelines**
1. Follow TypeScript best practices
2. Use semantic HTML5 elements
3. Implement responsive design principles
4. Write clean, commented code
5. Test on multiple devices and browsers

### **Code Style**
- Use ESLint configuration
- Follow React hooks rules
- Implement proper error handling
- Use meaningful variable names

### **Pull Request Process**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request with description

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🚀 Deployment

### **Production Build**
```bash
npm run build
```

### **Deployment Options**
- **Vercel**: Recommended for React apps
- **Netlify**: Static site hosting
- **Firebase Hosting**: Integrated with Firebase
- **AWS S3**: Cloud storage hosting

### **Environment Setup**
- Configure production Firebase settings
- Set up custom domain
- Enable HTTPS
- Configure CDN for assets

---

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the documentation
- Contact the development team

---

**Built with ❤️ for restaurant owners worldwide**

*Fast7 - Empowering restaurants to go digital in minutes, not hours!*
