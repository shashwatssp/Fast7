// Block third-party tracking and analytics scripts
(function() {
  'use strict';

  // List of tracking domains to block
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

  // Override document.createElement to prevent tracking scripts
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(this, tagName);
    
    if (tagName.toLowerCase() === 'script') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name, value) {
        if (name === 'src' && BLOCKED_DOMAINS.some(domain => value.includes(domain))) {
          console.warn('Blocked tracking script:', value);
          return;
        }
        return originalSetAttribute.call(this, name, value);
      };
    }
    
    return element;
  };

  // Block dynamic script insertion
  const originalAppendChild = Node.prototype.appendChild;
  Node.prototype.appendChild = function(child) {
    if (child.tagName === 'SCRIPT' && child.src && BLOCKED_DOMAINS.some(domain => child.src.includes(domain))) {
      console.warn('Blocked dynamic tracking script:', child.src);
      return;
    }
    return originalAppendChild.call(this, child);
  };

  // Intercept and block fetch requests to tracking domains
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (typeof url === 'string' && BLOCKED_DOMAINS.some(domain => url.includes(domain))) {
      console.warn('Blocked fetch request to tracking domain:', url);
      return Promise.resolve(new Response('null', { status: 204, statusText: 'No Content' }));
    }
    return originalFetch.call(this, url, options);
  };

  // Block WebSocket connections to tracking domains
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    if (typeof url === 'string' && BLOCKED_DOMAINS.some(domain => url.includes(domain))) {
      console.warn('Blocked WebSocket connection to tracking domain:', url);
      throw new Error('WebSocket connection to tracking domain blocked');
    }
    return new originalWebSocket(url, protocols);
  };

  // Remove any existing tracking scripts
  function removeTrackingScripts() {
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.src && BLOCKED_DOMAINS.some(domain => script.src.includes(domain))) {
        script.remove();
        console.warn('Removed existing tracking script:', script.src);
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