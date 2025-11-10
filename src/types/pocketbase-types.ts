/**
 * PocketBase TypeScript Type Definitions
 * Types for display-related collections
 */

// Base record interface
export interface BaseRecord {
  id: string
  created: string
  updated: string
}

// Displays collection
export interface DisplaysRecord extends BaseRecord {
  display_user: string  // relation to users
  available: boolean
  host: string | null  // relation to users (host who claimed)
  game: string | null  // relation to games
  code: string  // 6-digit numeric code
}
