# Fast7⚡

**Launch Your Restaurant Online in 7 Minutes!**

Fast7 is a SaaS Restaurant Website Builder designed to help restaurant owners create stunning websites for their businesses in under 7 minutes. With a clean UI and mobile-first design, Fast7 makes it easy to establish an online presence.

---

## Table of Contents
1. [Features](#features)
2. [Technologies Used](#technologies-used)

---

## Features
- **Mobile-First Design**: Fully responsive and optimized for mobile devices.
- **Quick Setup**: Get your restaurant online in 7 Minutes.
- **Google Login Integration**: Easily continue with Google.
- **Beautiful UI**: Designed with Tailwind CSS for a modern look and feel.
- **Lightning-Fast Development**: Built with Vite for fast builds and hot module replacement.

---

## Technologies Used
- **React**: Frontend framework for building user interfaces.
- **Vite**: Lightning-fast build tool for modern web apps.
- **TypeScript**: Strongly typed JavaScript for better development experience.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Google OAuth**: Authentication integration with Google.

---

## Running on Local Network (Mobile Access)

The development server is configured to be accessible from mobile devices on your local WiFi network.

### Setup Instructions

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Find your local IP address:**
   - **Windows**: Open Command Prompt and run `ipconfig`. Look for "IPv4 Address" under your active network adapter.
   - **Mac/Linux**: Open Terminal and run `ifconfig` or `ip addr show`. Look for your WiFi adapter's IP address (usually starts with 192.168.x.x or 10.0.x.x).

3. **Access from mobile device:**
   - Make sure your mobile device is connected to the same WiFi network as your computer.
   - Open a browser on your mobile device and navigate to:
     ```
     http://YOUR_LOCAL_IP:5173
     ```
     For example: `http://192.168.1.100:5173`

4. **Troubleshooting:**
   - If you can't access the server, check your firewall settings to ensure port 5173 is allowed.
   - Verify both devices are on the same network.
   - Try accessing from your computer using `http://localhost:5173` first to ensure the server is running.

### Network Configuration

The Vite server is configured to bind to `0.0.0.0`, which allows connections from any device on your local network. This is set in `vite.config.ts`.

---
