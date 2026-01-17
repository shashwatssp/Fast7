export interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  sound?: string;
  vibrate?: number[];
  requireInteraction?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

class NotificationService {
  private hasPermission: boolean = false;
  private isSupported: boolean = false;

  constructor() {
    this.checkSupport();
  }

  /**
   * Check if notifications are supported in this browser
   */
  private checkSupport(): void {
    // First verify we're in a browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      this.isSupported = false;
      return;
    }

    // Check if Notification API is available
    if (typeof Notification !== 'undefined' && 'Notification' in window) {
      this.isSupported = true;
      this.hasPermission = Notification.permission === 'granted';
    } else {
      this.isSupported = false;
    }
  }

  /**
   * Request permission for notifications
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Notifications are not supported in this browser');
      return false;
    }

    if (this.hasPermission) {
      return true;
    }

    try {
      // Additional guard for Notification API
      if (typeof Notification === 'undefined' || !Notification.requestPermission) {
        console.warn('Notification.requestPermission is not available');
        return false;
      }

      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Show a browser notification
   */
  async showNotification(config: NotificationConfig): Promise<void> {
    if (!this.isSupported || !this.hasPermission) {
      console.warn('Cannot show notification: not supported or no permission');
      return;
    }

    try {
      // Additional guard for Notification constructor
      if (typeof Notification === 'undefined') {
        console.warn('Notification constructor is not available');
        return;
      }

      const notification = new Notification(config.title, {
        body: config.body,
        icon: config.icon || '/vite.svg',
        badge: config.badge || '/vite.svg',
        requireInteraction: config.requireInteraction || false,
        tag: 'delivery-notification'
      });
      
      // Vibrate separately if supported
      if (config.vibrate) {
        this.vibrate(config.vibrate);
      }

      // Auto-close after 10 seconds if not requiring interaction
      if (!config.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }

      // Handle notification clicks with window guard
      notification.onclick = () => {
        if (typeof window !== 'undefined' && window.focus) {
          window.focus();
        }
        notification.close();
      };

    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Show delivery arrival notification
   */
  async showDeliveryArrivalNotification(orderId: string, customerName?: string): Promise<void> {
    const config: NotificationConfig = {
      title: '🎉 Order Delivered!',
      body: customerName 
        ? `Hi ${customerName}, your order has been successfully delivered! Enjoy your meal!`
        : 'Your order has been successfully delivered! Enjoy your meal!',
      icon: '/vite.svg',
      badge: '/vite.svg',
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
      actions: [
        {
          action: 'track-order',
          title: 'View Order',
          icon: '/vite.svg'
        },
        {
          action: 'rate-order',
          title: 'Rate Order',
          icon: '/vite.svg'
        }
      ]
    };

    await this.showNotification(config);
  }

  /**
   * Show order status update notification
   */
  async showOrderStatusNotification(status: string, orderId: string): Promise<void> {
    const statusMessages = {
      preparing: {
        title: '🍳 Order Preparing',
        body: 'Your order is being prepared with fresh ingredients!'
      },
      ready: {
        title: '✅ Order Ready',
        body: 'Your order is ready and waiting for delivery partner!'
      },
      delivering: {
        title: '🚚 Order On The Way',
        body: 'Your order is on the way! Track delivery in real-time.'
      },
      arrived: {
        title: '📍 Delivery Partner Arrived',
        body: 'Your delivery partner has reached your location!'
      }
    };

    const message = statusMessages[status as keyof typeof statusMessages];
    if (!message) return;

    const config: NotificationConfig = {
      title: message.title,
      body: message.body,
      icon: '/vite.svg',
      badge: '/vite.svg',
      vibrate: [100, 50, 100],
      requireInteraction: false
    };

    await this.showNotification(config);
  }

  /**
   * Show delivery partner nearby notification
   */
  async showDeliveryPartnerNearbyNotification(etaMinutes: number): Promise<void> {
    const config: NotificationConfig = {
      title: '🚚 Delivery Partner Nearby',
      body: `Your order will arrive in approximately ${etaMinutes} minutes!`,
      icon: '/vite.svg',
      badge: '/vite.svg',
      vibrate: [150, 75, 150],
      requireInteraction: false
    };

    await this.showNotification(config);
  }

  /**
   * Check if notifications are supported
   */
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Check if we have permission to show notifications
   */
  hasNotificationPermission(): boolean {
    return this.hasPermission;
  }

  /**
   * Play notification sound (if available)
   */
  playNotificationSound(type: 'arrival' | 'update' | 'nearby' = 'update'): void {
    try {
      // Check if Audio is available (SSR guard)
      if (typeof Audio === 'undefined') {
        return;
      }

      const audio = new Audio();
      
      switch (type) {
        case 'arrival':
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
          break;
        case 'update':
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
          break;
        case 'nearby':
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
          break;
      }
      
      audio.volume = 0.3;
      audio.play().catch(error => {
        console.log('Could not play notification sound:', error);
      });
    } catch (error) {
      console.log('Error playing notification sound:', error);
    }
  }

  /**
   * Vibrate device (if available)
   */
  vibrate(pattern: number | number[] = [200, 100, 200]): void {
    // Add navigator guard for SSR safety
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Types are already exported above