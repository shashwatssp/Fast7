Dash ⚡
Launch Your Restaurant Online in Minutes!

Dash is a React application designed to help restaurant owners create stunning websites for their businesses in under 10 minutes. With a clean UI and mobile-first design, Dash makes it easy to establish an online presence.

Table of Contents
Features

Technologies Used

Installation

Usage

Project Structure

Contributing

License

Features
Mobile-First Design: Fully responsive and optimized for mobile devices.

Quick Setup: Get your restaurant online in minutes.

Google Login Integration: Easily continue with Google.

Beautiful UI: Designed with Tailwind CSS for a modern look and feel.

Lightning-Fast Development: Built with Vite for fast builds and hot module replacement.

Technologies Used
React: Frontend framework for building user interfaces.

Vite: Lightning-fast build tool for modern web apps.

TypeScript: Strongly typed JavaScript for better development experience.

Tailwind CSS: Utility-first CSS framework for styling.

Google OAuth: Authentication integration with Google.

Installation
Follow these steps to set up the project locally:

Clone the repository:

bash
git clone https://github.com/shashwatssp/Dash.git
cd Dash
Install dependencies:

bash
npm install
Start the development server:

bash
npm run dev
Open the app in your browser:

Local URL: http://localhost:5173

Network URL (for mobile testing): Use the IP address displayed in the terminal.

Usage
Run the App
After starting the development server (npm run dev), you can access the app on your browser or mobile device (if on the same network).

Build for Production
To create an optimized production build:

bash
npm run build
The build files will be generated in the dist folder.

Preview Production Build
To preview the production build locally:

bash
npm run preview
Project Structure
plaintext
Dash/
├── public/               # Static assets (e.g., favicon, images)
├── src/
│   ├── components/       # React components (e.g., HomePage.tsx)
│   ├── styles/           # Tailwind CSS configuration and custom styles
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point for React app
│   └── index.css         # Tailwind directives and global styles
├── .gitignore            # Files to ignore in Git repository
├── package.json          # Project dependencies and scripts
├── tailwind.config.js    # Tailwind CSS configuration file
└── vite.config.ts        # Vite configuration file
Contributing
Contributions are welcome! To contribute:

Fork this repository.

Create a new branch:

bash
git checkout -b feature/your-feature-name
Make your changes and commit them:

bash
git commit -m "Add your message here"
Push to your forked repository:

bash
git push origin feature/your-feature-name
Open a pull request on GitHub.