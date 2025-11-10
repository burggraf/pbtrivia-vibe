/**
 * PocketBase TypeScript Type Definitions
 * Generated for display application collections
 */

// Base record interface
export interface BaseRecord {
  id: string
  created: string
  updated: string
}

// Users collection (_pb_users_auth_)
export interface UsersRecord extends BaseRecord {
  email: string
  verified: boolean
  tokenKey: string
}

// Displays collection
export interface DisplaysRecord extends BaseRecord {
  display_user: string  // relation to users
  available: boolean
  host: string | null  // relation to users (host who claimed)
  game: string | null  // relation to games
  code: string  // 6-digit numeric code
  metadata?: {
    theme?: 'light' | 'dark'
  } | null
}

// Games collection
export interface GamesRecord extends BaseRecord {
  host: string  // relation to users
  name: string
  code: string  // 6-character game code
  startdate?: string
  duration?: number
  location?: string
  status: 'setup' | 'ready' | 'in-progress' | 'completed'
  scoreboard?: {
    teams: {
      [teamId: string]: {
        name: string
        players: Array<{
          id: string
          name: string
          email: string
        }>
        score: number
      }
    }
  }
  data?: {
    state?: 'game-start' | 'round-start' | 'round-play' | 'round-end' | 'game-end' | 'thanks' | 'return-to-lobby'
    round?: {
      round_number: number
      rounds: number
      question_count: number
      title: string
      categories?: string[]
    }
    question?: {
      id: string
      question_number: number
      category: string
      question: string
      difficulty: string
      a: string
      b: string
      c: string
      d: string
      correct_answer: string
      submitted_answer: string
    }
  }
  metadata?: {
    question_timer?: number | null
    answer_timer?: number | null
    game_start_timer?: number | null
    round_start_timer?: number | null
    game_end_timer?: number | null
    thanks_timer?: number | null
  }
}
