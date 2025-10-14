# NPC Finder

> **Track what matters. Share with friends. Keep it private.**

A modern, invite-only React app for tracking movies, TV shows, games, books, and more. Built with privacy in mind - your data is protected from other users, with plans for end-to-end encryption for truly sensitive content.

## 🔐 Privacy-First Design

**Invite-Only Access** - No public signups. Share codes with trusted friends only.

**Two-Tier Security Model:**

- **Standard Security**: Media tracking with friend sharing (current)
- **E2E Encryption**: Diary & health data that even the admin can't see (planned)

**Learn More:**

- 📖 [Privacy Reality Check](docs/PRIVACY_REALITY_CHECK.md) - What we can (and can't) promise
- 🗺️ [Feature Roadmap](ROADMAP.md) - What's coming next
- 🔮 [Future E2E Encryption](docs/FUTURE_E2E_ENCRYPTION.md) - Technical plan for sensitive data

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

### Getting Started

- **[Quick Start Guide](docs/QUICK_START.md)** - Get up and running in 30 minutes
- **[Invite System Setup](INVITE_SYSTEM_QUICKSTART.md)** - How invite codes work
- **[Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)** - Pre-launch checklist

### Features & Architecture

- **[Media System Guide](docs/MEDIA_SYSTEM_GUIDE.md)** - Complete architecture and implementation details
- **[Supabase Setup](docs/SUPABASE_SETUP.md)** - Database schema and configuration
- **[API Setup](docs/API_SETUP.md)** - External API integration guide

### Privacy & Security

- **[Privacy Reality Check](docs/PRIVACY_REALITY_CHECK.md)** - Honest explanation of what's private
- **[Talking to Friends About Privacy](docs/TALKING_TO_FRIENDS_ABOUT_PRIVACY.md)** - How to explain security to users
- **[Future E2E Encryption](docs/FUTURE_E2E_ENCRYPTION.md)** - Plan for diary & health encryption
- **[GitHub Security Checklist](docs/GITHUB_SECURITY_CHECKLIST.md)** - Pre-publication security review

### Testing

- **[Testing Guide](docs/TESTING_GUIDE.md)** - How to write and run tests
- **[Test Results](TEST_RESULTS.md)** - Current test coverage (78 tests passing ✅)

### Security

- **[Security Checks Guide](docs/SECURITY_CHECKS.md)** - How to run security audits and interpret results
- **[GitHub Security Checklist](docs/GITHUB_SECURITY_CHECKLIST.md)** - Pre-publication security review

### Roadmap

- **[Feature Roadmap](ROADMAP.md)** - What's coming next

**Start here**: `docs/QUICK_START.md` for step-by-step setup instructions!

## 🎓 Learning Goals & Portfolio Value

This project demonstrates:

- **Modern React Patterns**: Hooks, Context, custom hooks, and best practices
- **Security Architecture**: Invite-only system with Row-Level Security (RLS)
- **Database Design**: Relational database with Supabase and PostgreSQL
- **API Integration**: Multiple external APIs with error handling
- **Testing**: Comprehensive test suite with Vitest (78 tests passing)
- **Privacy by Design**: Two-tier security model (standard + E2E encryption)
- **TypeScript**: Type-safe development with proper interfaces
- **Component Architecture**: Reusable, composable components
- **Authentication & Authorization**: Secure invite code system
- **Accessibility**: ARIA labels, keyboard navigation, semantic HTML
- **Performance**: Optimized builds, lazy loading, efficient state management

**For Recruiters**: This is a production-ready app showcasing full-stack development, security consciousness, and thoughtful architecture.

## 🤝 Privacy Promise

**What IS Private:**

- Your data is protected from other users via Row-Level Security
- No selling, sharing, or third-party access
- No analytics or tracking
- Invite-only for trusted friends

**What Is NOT Private (Yet):**

- This isn't end-to-end encrypted like Signal (for media tracking)
- Admin can technically access the database
- Supabase (hosting provider) can access data

**Future Plans:**

- E2E encryption for diary entries (truly private thoughts)
- E2E encryption for health data (weight, fitness metrics)
- Standard security for social features (movies, recommendations)

Read the full explanation: [Privacy Reality Check](docs/PRIVACY_REALITY_CHECK.md)

## 🗺️ Roadmap

**Current Phase:** MVP Complete ✅

- ✅ Invite-only authentication
- ✅ Media tracking (movies, TV, games, books)
- ✅ Demo landing page
- ✅ Comprehensive testing

**Next Phase:** Social Features 👥

- Friend system
- Share recommendations
- Activity feed

**Future Phase:** E2E Encryption 🔐

- Encrypted diary entries
- Encrypted health tracking
- Password-protected unlock

See the full roadmap: [ROADMAP.md](ROADMAP.md)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works!)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/aftongauntlett/npcfinder.git
cd npcfinder

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

### First-Time Setup

1. **Set up Supabase** - Run the SQL scripts in your Supabase dashboard
2. **Create invite codes** - Use the admin panel to generate codes
3. **Invite friends** - Share codes via Signal or secure messaging
4. **Deploy** - Push to Vercel/Netlify

See [Quick Start Guide](docs/QUICK_START.md) for detailed instructions.

---

## 📬 Contact

Questions about privacy, security, or features? Check the docs or open an issue!

## 📄 License

This is a personal project for learning and portfolio purposes.

---

_Built with ❤️ and a focus on privacy, security, and modern React patterns._
