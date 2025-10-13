# NPC Finder

> Your personal dashboard for everything you love - curated just for you.

A modern React application designed as a comprehensive personal dashboard for tracking movies & TV shows, music, games, books, fitness, restaurants, and more. Built with learning and modern React best practices in mind.

## ✨ Features

### 🎬 Media Tracking System (New!)

Comprehensive tracking for Movies, TV Shows, Games, and Books with:

- **Smart Search**: Search external APIs (TMDB, RAWG, Google Books)
- **Personal Ratings**: Rate items 1-5 stars with status tracking
- **External Scores**: View critic and audience ratings
- **Friend Comparisons**: See what your friends rated
- **Top 10 Lists**: Create and share custom lists
- **Random Suggestions**: Get random picks from your library
- **Beautiful UI**: Sparkle hover effects and dark mode
- **Full CRUD**: Powered by Supabase backend

📚 **See `docs/QUICK_START.md` to set it up in 30 minutes!**

### 💪 Fitness Tracking

- **Weight Tracking**: Log daily weight with notes and visualize trends
- **Body Measurements**: Track waist, hip, chest, thigh, and arm measurements
- **Workout Logging**: Record exercises with type, duration, and details
- **Meal Tracking**: Log meals with quality tags and notes
- **Dashboard Analytics**: View today's logs, streak counter, and progress charts
- **Data Management**: Export/import your fitness data as JSON
- **Offline Storage**: All data stored locally with IndexedDB

### 🌈 UI/UX Features

- **Dark/Light Mode**: System-aware theme with manual override
- **Sparkle Effects**: Mesmerizing hover animations
- **Responsive Design**: Mobile-first, works on all devices
- **Real-time Weather**: Geolocation-based weather in navbar
- **Mauve/Purple Theme**: Beautiful custom color scheme

### 📋 Additional Dashboard Cards

- **News**: Stay updated with latest headlines
- **Bookmarks**: Quick access to your favorite links
- **Vault**: Secure storage for important notes
- **Food & Places**: Restaurant reviews and travel memories
- **Journal**: Daily thoughts and creative expressions

## 🛠️ Tech Stack

- **React 19** - Latest React with improved performance
- **Vite** - Next-generation frontend tooling
- **Tailwind CSS** - Utility-first CSS with dark mode
- **Supabase** - Backend as a Service (database, auth, real-time)
- **Dexie** - IndexedDB wrapper for offline storage
- **Recharts** - Composable charting library
- **Lucide React** - Beautiful icon library
- **PropTypes** - Runtime type checking
- **Modern JavaScript** - ES6+ features and patterns

### External APIs

- **TMDB** - Movies & TV database
- **RAWG** - Games database
- **Google Books API** - Books database
- **Open-Meteo** - Weather data

## 📖 Documentation

Comprehensive guides available in the `docs/` folder:

- **[Quick Start Guide](docs/QUICK_START.md)** - Get up and running in 30 minutes
- **[Media System Guide](docs/MEDIA_SYSTEM_GUIDE.md)** - Complete architecture and implementation details
- **[Supabase Setup](docs/SUPABASE_SETUP.md)** - Database schema and configuration
- **[API Setup](docs/API_SETUP.md)** - External API integration guide
- **[Sparkle Effect](docs/SPARKLE_EFFECT.md)** - Using the sparkle hover effect
- **[System Summary](docs/SUMMARY.md)** - Overview of the entire media tracking system

**Start here**: `docs/QUICK_START.md` for step-by-step setup instructions!

## 🎓 Learning Goals

This project demonstrates:

- **Class Components → Functional Components**: Traditional patterns vs modern hooks
- **State Management**: From `this.state` to `useState` and beyond
- **Component Architecture**: Reusable, composable components
- **Modern React Patterns**: Context, custom hooks, and best practices
- **API Integration**: Multiple external APIs with error handling
- **Database Design**: Relational database with Supabase
- **Accessibility**: ARIA labels, keyboard navigation, semantic HTML
- **Performance**: Controlled inputs, PropTypes validation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

_This is a personal learning project focused on React fundamentals and interview preparation. Not intended for commercial use._+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
