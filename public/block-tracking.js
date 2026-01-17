// Block third-party tracking and analytics scripts
(function() {
  'use strict';

  // List of tracking domains to block (excluding legitimate Google APIs)
  const BLOCKED_DOMAINS = [
    'bugsnag.com',
    'sessions.bugsnag.com',
    'analytics.google.com',
    'googletagmanager.com',
    'facebook.net',
    'connect.facebook.net',
    'doubleclick.net',
    'google-analytics.com'
  ];
  
  // List of allowed Google API domains
  const ALLOWED_GOOGLE_DOMAINS = [
    'apis.google.com',
    'accounts.google.com',
    'www.googleapis.com',
    'oauth2.googleapis.com',
    'firebase.googleapis.com',
    'firestore.googleapis.com',
    'identitytoolkit.googleapis.com'
  ];

  // Override document.createElement to prevent tracking scripts
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(this, tagName);
    
    if (tagName.toLowerCase() === 'script') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name, value) {
        if (name === 'src') {
          // Block tracking domains
          if (BLOCKED_DOMAINS.some(domain => value.includes(domain))) {
            console.warn('Blocked tracking script:', value);
            return;
          }
          // Allow legitimate Google APIs
          if (ALLOWED_GOOGLE_DOMAINS.some(domain => value.includes(domain))) {
            return originalSetAttribute.call(this, name, value);
          }
        }
        return originalSetAttribute.call(this, name, value);
      };
    }
    
    return element;
  };

  // Block dynamic script insertion
  const originalAppendChild = Node.prototype.appendChild;
  Node.prototype.appendChild = function(child) {
    if (child.tagName === 'SCRIPT' && child.src) {
      // Block tracking domains
      if (BLOCKED_DOMAINS.some(domain => child.src.includes(domain))) {
        console.warn('Blocked dynamic tracking script:', child.src);
        return;
      }
      // Allow legitimate Google APIs
      if (ALLOWED_GOOGLE_DOMAINS.some(domain => child.src.includes(domain))) {
        return originalAppendChild.call(this, child);
      }
    }
    return originalAppendChild.call(this, child);
  };

  // Intercept and block fetch requests to tracking domains
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (typeof url === 'string') {
      // Block tracking domains
      if (BLOCKED_DOMAINS.some(domain => url.includes(domain))) {
        console.warn('Blocked fetch request to tracking domain:', url);
        return Promise.resolve(new Response('null', { status: 204, statusText: 'No Content' }));
      }
      // Allow legitimate Google APIs
      if (ALLOWED_GOOGLE_DOMAINS.some(domain => url.includes(domain))) {
        return originalFetch.call(this, url, options);
      }
    }
    return originalFetch.call(this, url, options);
  };

  // Block WebSocket connections to tracking domains
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    if (typeof url === 'string') {
      // Block tracking domains
      if (BLOCKED_DOMAINS.some(domain => url.includes(domain))) {
        console.warn('Blocked WebSocket connection to tracking domain:', url);
        throw new Error('WebSocket connection to tracking domain blocked');
      }
      // Allow legitimate Google APIs
      if (ALLOWED_GOOGLE_DOMAINS.some(domain => url.includes(domain))) {
        return new originalWebSocket(url, protocols);
      }
    }
    return new originalWebSocket(url, protocols);
  };

  // Remove any existing tracking scripts
  function removeTrackingScripts() {
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.src) {
        // Block tracking domains
        if (BLOCKED_DOMAINS.some(domain => script.src.includes(domain))) {
          script.remove();
          console.warn('Removed existing tracking script:', script.src);
        }
        // Don't remove legitimate Google API scripts
        if (ALLOWED_GOOGLE_DOMAINS.some(domain => script.src.includes(domain))) {
          // Keep these scripts
          return;
        }
      }
    });
  }

  // Run immediately and also after DOM is loaded
  removeTrackingScripts();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeTrackingScripts);
  }

  // Periodically check for and remove tracking scripts
  setInterval(removeTrackingScripts, 5000);

  console.log('Tracking protection enabled');
})();