import { AxiosRequestConfig } from "axios";

/**
 * Authentication utility functions for handling tokens and authentication
 */

// Token key used in localStorage
export const AUTH_TOKEN_KEY = "token";

/**
 * Get the authentication token from localStorage
 * @returns The authentication token or null if not found
 */
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * Set the authentication token in localStorage
 * @param token The token to store
 */
export const setAuthToken = (token: string): void => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

/**
 * Remove the authentication token from localStorage
 */
export const removeAuthToken = (): void => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

/**
 * Check if the user is authenticated (has a token)
 * @returns True if authenticated, false otherwise
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

/**
 * Add authorization header to axios config
 * @param config The axios request config
 * @returns Updated config with auth header
 */
export const addAuthHeader = (
  config: AxiosRequestConfig
): AxiosRequestConfig => {
  const token = getAuthToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
};

/**
 * Handle authentication errors (401)
 * Logs out the user and redirects to login page
 */
export const handleAuthError = (): void => {
  removeAuthToken();
  window.location.reload();
};

// Parse JWT token to get expiration time and other claims
export const parseJwt = (token: string): any => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  const decoded = parseJwt(token);
  if (!decoded) {
    return true;
  }

  // Get current time in seconds
  const currentTime = Date.now() / 1000;

  // Check if token is expired
  return decoded.exp < currentTime;
};

// Get the user info from the token
export const getUserFromToken = (): any => {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  const decoded = parseJwt(token);
  return decoded;
};
