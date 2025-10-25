# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Starting Development Environment

- `./dev.sh` - Start complete development environment (PocketBase + frontend)
- `npm run dev` - Start frontend development server only (requires PocketBase running separately)
- `./kill-servers.sh` - Kill all development servers on ports 5173-5179

### Building and Testing

- `npm run build` - Build for production (runs TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint with TypeScript rules
- `npm run preview` - Preview production build locally

### Database Operations

- `pocketbase serve --dev --http 0.0.0.0:8090` - Start PocketBase server
- `pocketbase superuser upsert admin@example.com Password123` - Create/update admin account
- `npm run import-questions-efficient` - Import questions with optimized performance

## Architecture Overview

This is a trivia game application built with React + TypeScript frontend and PocketBase backend.

### Frontend Architecture

- **React 18** with React Router for navigation
- **TypeScript** for type safety
- **Vite** as build tool and dev server
- **Tailwind CSS** for styling
- **shadcn/ui** component library built on Radix UI primitives
- **Context-based theme system** with dark/light mode support

### Backend Architecture

- **PocketBase** as backend database and API server
- **SQLite** database file located in `pb_data/data.db`
- **Real-time subscriptions** for live game updates
- **Authentication system** with email/password

### Key Data Models

- **Games**: Host-created trivia sessions with status tracking (`setup`, `ready`, `in-progress`, `completed`)
- **Rounds**: Individual rounds within games containing questions and answers
- **Questions**: 60K+ trivia questions imported from TSV with categories, difficulty levels, and multiple choice answers

### File Structure

- `src/pages/` - Route-level components (AuthPage, HostPage, LobbyPage)
- `src/components/` - Reusable UI components and game-specific components
- `src/lib/` - PocketBase client, game logic, and utility functions
- `src/types/` - TypeScript type definitions
- `scripts/` - Database import and maintenance scripts

### Development Workflow

1. PocketBase runs on port 8090 (SQLite database in `pb_data/`)
2. Frontend dev server runs on port 5173 (or next available)
3. The `dev.sh` script handles both servers automatically
4. Admin panel available at `http://localhost:8090/_/`

### PocketBase Configuration

- Default admin: `admin@example.com` / `Password123`
- Database URL: `http://localhost:8090`
- Collections: games, rounds, questions (auto-created by import scripts)

### Question Import System

The application includes a robust question import system:

- Source: `questions.tsv` (~60K questions)
- Automatic collection schema creation
- Duplicate prevention using external_id
- Batch processing for performance
- Progress tracking and error handling

### Authentication Flow

- Users authenticate with PocketBase using email/password
- Auth state is managed through React context
- Routes are protected based on authentication status
- Auto-reconnection handling for PocketBase connection issues
