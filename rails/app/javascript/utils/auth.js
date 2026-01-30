// Authentication utility functions for unified token management

const TOKEN_KEY = 'bmpl-token';

/**
 * Validate token by calling the Devise validation endpoint
 * @param {string} token - JWT token to validate
 * @returns {Promise<boolean>} - true if token is valid
 */
export async function validateToken(token) {
  if (!token) return false;

  try {
    const response = await fetch('/users/validate', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    // Backend returns 401 for invalid/expired tokens
    if (response.status === 401) {
      clearAuthToken();
      return false;
    }

    return response.ok;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

/**
 * Clear authentication token from storage
 */
export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Get authentication token from storage
 * @returns {string|null} - JWT token or null
 */
export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Set authentication token in storage
 * @param {string} token - JWT token to store
 */
export function setAuthToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Redirect to login page if not already there
 */
export function redirectToLogin() {
  if (window.location.pathname !== '/sign_in' && window.location.pathname !== '/') {
    window.location.href = '/sign_in';
  }
}
