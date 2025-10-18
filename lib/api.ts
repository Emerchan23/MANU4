// API utility functions

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

// Session management - now uses database sessions
async function clearUserData(): Promise<void> {
  if (typeof window === "undefined") return
  
  try {
    // Get session ID from cookie
    const sessionId = document.cookie
      .split('; ')
      .find(row => row.startsWith('sessionId='))
      ?.split('=')[1]
    
    if (sessionId) {
      // Clear session from database
      await fetch('/api/sessions?action=delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId })
      })
    }
    
    // Clear session cookie
    document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  } catch (error) {
    console.error('Error clearing user session:', error)
  }
}

// API calls with session-based authentication
export async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  // Handle empty API_BASE_URL by defaulting to current origin
  const baseUrl = API_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")
  // Check if endpoint already starts with /api to avoid double /api/api
  const url = endpoint.startsWith('/api') ? `${baseUrl}${endpoint}` : `${baseUrl}/api${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for session authentication
  })

  if (response.status === 401) {
    await clearUserData()
    // Authentication removed - no redirect needed
    return
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Erro desconhecido" }))
    throw new Error(error.error || "Erro na requisição")
  }

  return response.json()
}