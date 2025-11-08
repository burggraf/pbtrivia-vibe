# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Management

**IMPORTANT**: This project uses **pnpm** as the package manager. Always use `pnpm` commands instead of `npm`.

- `pnpm install` - Install dependencies
- `pnpm run <script>` - Run package scripts
- `pnpm add <package>` - Add new dependency
- `pnpm remove <package>` - Remove dependency

## Development Commands

### Starting Development Environment

- `./dev.sh` - Start complete development environment (PocketBase + frontend) on port 5173
- `pnpm run dev` - Start frontend development server only (requires PocketBase running separately)

### Building and Testing

- `pnpm run build` - Build for production (runs TypeScript compilation + Vite build)
- `pnpm run lint` - Run ESLint with TypeScript rules
- `pnpm run preview` - Preview production build locally

### Database Operations

- `pocketbase serve --dev --http 0.0.0.0:8090` - Start PocketBase server
- `pocketbase superuser upsert admin@example.com Password123` - Create/update admin account
- `pnpm run import-questions-efficient` - Import questions with optimized performance (recommended) (used to load the questions data from questions.tsv into the questions collection)

### Database Migrations

- PocketBase migrations are located in `pb_migrations/` directory
- Migrations are automatically applied when PocketBase starts
- See `pocketbase-migration-best-practices.md` for migration guidelines
- **CRITICAL**: Never hardcode collection IDs - always resolve dynamically

## Architecture Overview

This is a trivia game application built with React + TypeScript frontend and PocketBase backend.

### Frontend Architecture

- **React 18** with React Router for navigation
- **TypeScript** for type safety
- **Vite** as build tool and dev server with path aliases (`@/` maps to `src/`)
- **Tailwind CSS** for styling
- **shadcn/ui** component library built on Radix UI primitives
- **Context-based theme system** with dark/light mode support
- **Real-time PocketBase subscriptions** for live game updates

### UI/UX Standards

**IMPORTANT**: When creating or modifying UI components, always reference the UI Style Guide:

- **Style Guide**: See `docs/design/ui-style-guide.md` for comprehensive UI/UX standards
- **Component Library**: **ALWAYS use shadcn/ui components** - never create custom HTML components
- **Mobile-First**: Design for mobile first (375px width minimum), then enhance for larger screens
- **Responsive Design**: Use Tailwind responsive modifiers (`sm:`, `md:`, `lg:`) throughout
- **Dark Mode**: Include dark mode variants for all UI elements
- **Spacing Standards**: Follow progressive spacing patterns (mobile → tablet → desktop)
- **Typography Standards**: Use documented font size scales and responsive patterns
- **Touch Targets**: Maintain minimum 44px height for interactive elements on mobile

### Backend Architecture

- **PocketBase** as backend database and API server
- **SQLite** database file located in `pb_data/data.db`
- **Migration system** with version-controlled schema changes
- **Row-level security** with host-based access control
- **Authentication system** with email/password

### Database Schema

- **games**: Host-created trivia sessions with status tracking (`setup`, `ready`, `in-progress`, `completed`)
- **rounds**: Individual rounds within games containing questions and answers
- **questions**: 60K+ trivia questions with categories, difficulty, and multiple choice
- **round_questions**: Junction table linking rounds to specific questions
- **game_teams**: Teams participating in games
- **game_players**: Players assigned to teams in games

See `ERD.md` for detailed database relationships and schema documentation.

### Project Structure

```
src/
├── components/
│   ├── ui/           # Base shadcn/ui components (button, dialog, etc.)
│   └── games/        # Game-specific components (GameEditModal, etc.)
├── contexts/         # React contexts (ThemeContext)
├── lib/              # PocketBase client, game logic, utilities
├── pages/            # Route-level components (AuthPage, HostPage, LobbyPage)
└── types/            # TypeScript type definitions

pb_migrations/        # PocketBase migration files
pb_data/             # SQLite database and auxiliary files
scripts/             # Database import and maintenance scripts
```

### Development Workflow

1. PocketBase runs on port 8090 (SQLite database in `pb_data/`)
2. Frontend dev server runs on port 5176 when using `./dev.sh` (or next available)
3. The `dev.sh` script handles both servers automatically and creates superuser
4. Admin panel available at `http://localhost:8090/_/`
5. Database migrations are applied automatically on PocketBase startup

### PocketBase Configuration

- Default admin: `admin@example.com` / `Password123`
- Database URL: Auto-detected at runtime (no .env files needed)
  - **Development mode** (running on non-standard port like 5173): Connects to `:8090` on same host
    - `http://localhost:5173` → `http://localhost:8090`
    - `http://192.168.1.122:5173` → `http://192.168.1.122:8090` (LAN testing)
  - **Production mode** (port 80/443 or no port): Uses same origin via Nginx reverse proxy
    - `https://trivia.azabab.com` → `https://trivia.azabab.com` (proxied to localhost:8090)
- Collections: games, rounds, questions, round_questions, game_teams, game_players
- Access control: Host-based row-level security using `host.id=@request.auth.id`

### Migration System

- **Critical Rule**: Never hardcode collection IDs - always resolve dynamically
- Migration files in `pb_migrations/` with timestamp naming: `{timestamp}_{description}.js`
- See `pocketbase-migration-best-practices.md` for detailed guidelines
- Migrations run automatically when PocketBase starts

### Question Import System

The application includes a robust question import system:

- Source: `questions.tsv` (~60K questions)
- **Standard import**: `pnpm run import-questions`
- **Efficient import**: `pnpm run import-questions-efficient` (recommended)
- **Test import**: `pnpm run import-questions-test` (smaller dataset)
- Automatic collection schema creation
- Duplicate prevention using external_id
- Batch processing for performance (100 questions per batch)
- Progress tracking and error handling

### Timer Configuration

- Game timers configured via Create Game dialog (Timers accordion section)
- Timer values stored in `games.metadata` JSON field
- 6 timer types: question, answer, game_start, round_start, game_end, thanks
- Values in seconds, null/0 = no time limit
- Timer enforcement not yet implemented (data capture only)

### Authentication Flow

- Users authenticate with PocketBase using email/password
- Auth state is managed through React context
- Routes are protected based on authentication status (`/host`, `/lobby` require auth)
- Auto-reconnection handling for PocketBase connection issues
- Connection status displayed during app initialization

### Code Organization Patterns

- **UI Components**: Base components in `src/components/ui/` following shadcn/ui patterns
- **Game Components**: Feature-specific components in `src/components/games/`
- **Libraries**: PocketBase client (`lib/pocketbase.ts`), game logic (`lib/games.ts`, `lib/rounds.ts`)
- **Type Definitions**: TypeScript types in `src/types/` matching database collections
- **Path Aliases**: Use `@/` prefix for imports from `src/` directory (configured in Vite)

### Access Control Patterns

- Most collections use `host.id=@request.auth.id` for row-level security
- Games are isolated by host - users can only access their own games
- Questions have public read access for game functionality
- Player assignments track both host and player for audit trails
