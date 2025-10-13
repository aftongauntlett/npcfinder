# NPC Finder

> Your personal dashboard for everything you love - curated just for you.

A modern React application designed as a comprehensive personal dashboard for tracking movies & TV shows, music, games, restaurants, and journal entries. Built with learning and interview preparation in mind, this project demonstrates both traditional and modern React patterns.

## Features

### Original Dashboard

- **Movies & TV**: Track films and series, rate favorites, and discover new content
- **Music**: Personal soundtrack library and discovery zone
- **Games**: Gaming backlog and achievement tracking
- **Food & Places**: Restaurant reviews and travel memories
- **Journal**: Daily thoughts and creative expressions
- **Real-time Clock**: Always know what time it is
- **90s/2000s Aesthetic**: Nostalgic web vibes with modern polish

### Fitness Tracking (New!)

- **Weight Tracking**: Log daily weight with notes and visualize trends
- **Body Measurements**: Track waist, hip, chest, thigh, and arm measurements
- **Workout Logging**: Record exercises with type, duration, and details
- **Meal Tracking**: Log meals with quality tags and notes
- **Dashboard Analytics**: View today's logs, streak counter, and progress charts
- **Data Management**: Export/import your fitness data as JSON
- **Dark/Light Mode**: System-aware theme with manual override
- **Offline Storage**: All data stored locally with IndexedDB

## Tech Stack

- **React 19** - Latest React with improved performance and features
- **Vite** - Next-generation frontend tooling
- **Tailwind CSS** - Utility-first CSS framework with dark mode support
- **TanStack Query** - Data fetching and caching
- **Dexie** - IndexedDB wrapper for offline data storage
- **Recharts** - Composable charting library for React
- **Lucide React** - Beautiful & consistent icon library
- **Modern JavaScript** - ES6+ features and patterns

## Learning Goals

This project is designed to demonstrate:

- **Class Components → Functional Components**: Traditional patterns vs modern hooks
- **State Management**: From `this.state` to `useState` and beyond
- **Side Effects**: `componentDidMount` vs `useEffect`
- **Data Fetching**: Before and after TanStack Query
- **Component Architecture**: Proper separation of concerns
- **Modern React Patterns**: Context, custom hooks, and best practices

## Development

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
