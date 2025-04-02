# Dash ⚡

**Launch Your Restaurant Online in Minutes!**

Dash is a React application designed to help restaurant owners create stunning websites for their businesses in under 10 minutes. With a clean UI and mobile-first design, Dash makes it easy to establish an online presence.

---

## Table of Contents
1. [Features](#features)
2. [Technologies Used](#technologies-used)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Project Structure](#project-structure)
6. [Contributing](#contributing)
7. [License](#license)

---

## Features
- **Mobile-First Design**: Fully responsive and optimized for mobile devices.
- **Quick Setup**: Get your restaurant online in minutes.
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

## Installation

Follow these steps to set up the project locally:

1. Clone the repository:
git clone https://github.com/shashwatssp/Dash.git
cd Dash

2. Install dependencies
npm install

3. Start the development server:
npm run dev


4. Open the app in your browser:
- Local URL: `http://localhost:5173`
- Network URL (for mobile testing): Use the IP address displayed in the terminal.

---

## Usage

### Run the App
After starting the development server (`npm run dev`), you can access the app on your browser or mobile device (if on the same network).

### Build for Production
To create an optimized production build:
npm run build

The build files will be generated in the `dist` folder.

### Preview Production Build
To preview the production build locally:

## Project Structure

Dash/
├── public/ # Static assets (e.g., favicon, images)
├── src/
│ ├── components/ # React components (e.g., HomePage.tsx)
│ ├── styles/ # Tailwind CSS configuration and custom styles
│ ├── App.tsx # Main app component
│ ├── main.tsx # Entry point for React app
│ └── index.css # Tailwind directives and global styles
├── .gitignore # Files to ignore in Git repository
├── package.json # Project dependencies and scripts
├── tailwind.config.js # Tailwind CSS configuration file
└── vite.config.ts # Vite configuration file