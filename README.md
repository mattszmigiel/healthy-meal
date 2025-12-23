# HealthyMeal

AI-powered recipe management application that helps you adapt recipes to your personal dietary needs and preferences.

## Table of Contents

- [About the Project](#about-the-project)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [Development](#development)
- [License](#license)

## About the Project

HealthyMeal is a web-based recipe management application that leverages artificial intelligence to help users adapt recipes to their personal dietary needs and preferences. The application addresses the common challenge faced by individuals with specific dietary requirements who struggle to adapt existing online recipes.

### Key Features

- **User Authentication**: Secure email/password-based authentication
- **Dietary Preference Management**: Create and manage detailed dietary profiles including allergies, diet types, and restrictions
- **Recipe CRUD Operations**: Create, read, update, and delete personal recipes
- **AI-Powered Recipe Modification**: Automatically adapt recipes based on your dietary preferences
- **Personal Recipe Library**: Build and organize your collection of customized recipes

### Target Users

- Individuals with dietary restrictions (allergies, intolerances, medical conditions)
- People following specific diets (vegan, keto, paleo, low-sodium, etc.)
- Health-conscious users seeking to optimize recipes for nutritional goals
- Home cooks looking for personalized recipe variations

### Key Differentiators

- AI-powered recipe modification based on individual dietary profiles
- Simple, focused recipe management without feature bloat
- Personal recipe library linked to user accounts
- Quick access to dietary preference-based recipe adaptations

## Tech Stack

### Frontend
- **[Astro](https://astro.build/) 5** - Modern web framework allowing fast, efficient websites with minimal JavaScript
- **[React](https://react.dev/) 19** - UI library providing interactivity where needed
- **[TypeScript](https://www.typescriptlang.org/) 5** - Static typing for better IDE support and code quality
- **[Tailwind CSS](https://tailwindcss.com/) 4** - Utility-first CSS framework for convenient styling
- **[Shadcn/ui](https://ui.shadcn.com/)** - Library of accessible React components

### Backend
- **[Supabase](https://supabase.com/)** - Comprehensive backend solution
  - PostgreSQL database
  - SDK serving as Backend-as-a-Service
  - Open source solution (can be hosted locally or on your own server)
  - Built-in user authentication

### AI Integration
- **[Openrouter.ai](https://openrouter.ai/)** - AI service providing:
  - Access to a wide range of models (OpenAI, Anthropic, Google, and others)
  - High efficiency and low costs
  - Financial limits on API keys

### Testing
- **[Vitest](https://vitest.dev/)** - Unit and integration testing
  - Built for Vite/Astro ecosystem
  - Fast execution with Jest-compatible API
  - Excellent TypeScript support
- **[Playwright](https://playwright.dev/)** - End-to-end testing
  - Multi-browser testing (Chrome, Firefox, Safari)
  - Reliable auto-waiting and screenshot/video capture
  - Excellent Astro support
- **[React Testing Library](https://testing-library.com/react)** - Component testing
  - User-centric approach to testing React components
- **[Supertest](https://github.com/ladjs/supertest)** - HTTP API testing
  - HTTP assertions for API route testing
- **[MSW](https://mswjs.io/)** (Mock Service Worker) - API mocking
  - Intercept and mock HTTP requests in tests

### CI/CD and Hosting
- **GitHub Actions** - CI/CD pipelines
- **DigitalOcean** - Application hosting via Docker image

## Prerequisites

Before you begin, ensure you have the following installed and configured:

- **Node.js** v22.14.0 (use [nvm](https://github.com/nvm-sh/nvm) for easy version management)
- **npm** (comes with Node.js)
- **Supabase account** - Sign up at [supabase.com](https://supabase.com)
- **Openrouter.ai API key** - Get your API key at [openrouter.ai](https://openrouter.ai)

## Getting Started

Follow these steps to set up the project locally:

### 1. Clone the repository

```bash
git clone https://github.com/mattszmigiel/healthy-meal.git
cd healthy-meal
```

### 2. Install Node.js version

If you're using nvm:

```bash
nvm install
nvm use
```

This will automatically use the Node.js version specified in `.nvmrc`.

### 3. Install dependencies

```bash
npm install
```

### 4. Set up environment variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit the `.env` file and add your credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

### 5. Run the development server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Lint code with ESLint |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run format` | Format code with Prettier |

## Project Structure

```
.
├── src/
│   ├── pages/          # Astro pages (file-based routing)
│   │   └── api/        # API endpoints
│   ├── components/     # React and Astro components
│   │   ├── ui/         # Shadcn/ui components
│   │   └── hooks/      # Custom React hooks
│   ├── layouts/        # Astro layouts
│   ├── lib/
│   │   └── services/   # Business logic
│   ├── db/             # Supabase clients and types
│   ├── types.ts        # Shared types (Entities, DTOs)
│   └── assets/         # Static internal assets
├── public/             # Public static assets
└── .ai/                # Project documentation (PRD, tech stack)
```

## Project Scope

### MVP Features (In Scope)

- User authentication (email/password)
- User profile with dietary preferences management
- Recipe CRUD operations (Create, Read, Update, Delete)
- AI-powered recipe modification based on dietary needs
- Personal recipe library (private to each user)
- Dietary preference categories:
  - Allergies and intolerances
  - Diet types (vegan, vegetarian, keto, paleo, etc.)
  - Religious dietary restrictions
  - Nutritional goals
  - Disliked ingredients

### Out of Scope for MVP

The following features are intentionally excluded from the initial MVP and may be considered for future releases:

- Recipe import from external URLs or websites
- Image upload or multimedia support
- Recipe sharing between users
- Social features (comments, likes, following)
- Public recipe discovery or browsing
- Recipe rating or review system
- Meal planning functionality
- Shopping list generation
- Nutritional calculations or detailed nutrition facts
- Recipe categories or tagging system
- Recipe versioning or history tracking
- Print-optimized recipe views
- Recipe export functionality (PDF, etc.)
- Multi-language support
- Third-party integrations beyond AI service
- Mobile native applications
- Offline functionality

## Project Status

**Current Phase: MVP Development**

This is the initial version of HealthyMeal, focusing on core recipe management and AI-powered customization features. The MVP emphasizes:

- Building a solid foundation for recipe management
- Implementing reliable AI-powered recipe adaptation
- Creating an intuitive user experience for dietary preference management
- Establishing secure user authentication and data privacy

### Future Considerations

Post-MVP enhancements may include:
- Recipe import from popular recipe websites
- Image support for recipes
- Recipe sharing with friends or public sharing
- Social engagement features
- Advanced meal planning tools
- Automatic shopping list generation
- Detailed nutritional analysis
- Recipe collections or cookbooks
- Advanced categorization and tagging

## Development

### Code Quality

The project uses several tools to maintain code quality:

- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit linting and formatting

### Git Workflow

Pre-commit hooks automatically:
- Fix ESLint issues on `*.{ts,tsx,astro}` files
- Format `*.{json,css,md}` files with Prettier

### Coding Standards

Please refer to [CLAUDE.md](./CLAUDE.md) for detailed coding practices and guidelines, including:
- Error handling patterns
- Component guidelines (Astro vs React)
- Styling with Tailwind
- Accessibility requirements
- Backend and database conventions

## License

MIT

---

Built with [Astro](https://astro.build/), [React](https://react.dev/), and [Supabase](https://supabase.com/)
