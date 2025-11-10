/**
 * Generate a random 15-character display ID
 * Format: [a-z0-9]{15}
 * Example: "k3j9x2m5p8r1w4q"
 */
export function generateDisplayId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(15)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => chars[byte % chars.length]).join('')
}

/**
 * Generate a random 16-character password
 * Character set: Alphanumeric (uppercase, lowercase, numbers)
 * Meets PocketBase minimum (8+ chars)
 */
export function generateDisplayPassword(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => chars[byte % chars.length]).join('')
}

/**
 * Generate a 6-digit numeric code
 * Range: 100000-999999
 * Same algorithm as game code generation
 */
export function generateDisplayCode(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  const code = (array[0] % 900000 + 100000).toString()
  return code
}

/**
 * Construct display email from ID
 * Format: {displayId}@trivia-party-displays.com
 */
export function getDisplayEmail(displayId: string): string {
  return `${displayId}@trivia-party-displays.com`
}

/**
 * LocalStorage keys for display credentials
 */
export const STORAGE_KEYS = {
  DISPLAY_ID: 'displayId',
  DISPLAY_PASSWORD: 'displayPassword',
} as const
