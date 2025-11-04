/**
 * Copy text to clipboard using modern Clipboard API with fallback
 *
 * @param text - The text to copy to clipboard
 * @returns Promise resolving to success status and optional error message
 */
export async function copyToClipboard(
  text: string
): Promise<{ success: boolean; error?: string }> {
  // Check if text is provided
  if (!text || text.trim() === '') {
    return {
      success: false,
      error: 'No text provided to copy',
    }
  }

  // Try modern Clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return { success: true }
    } catch (err) {
      console.error('Clipboard API failed:', err)

      // Check if it's a permission error
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        return {
          success: false,
          error: 'Clipboard permission denied',
        }
      }

      // Fall through to fallback method
    }
  }

  // Fallback method for older browsers or non-secure contexts
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text

    // Make the textarea invisible
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    textArea.setAttribute('aria-hidden', 'true')

    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)

    if (successful) {
      return { success: true }
    } else {
      return {
        success: false,
        error: 'Copy command failed',
      }
    }
  } catch (err) {
    console.error('Fallback copy failed:', err)
    return {
      success: false,
      error: 'Failed to copy to clipboard',
    }
  }
}
