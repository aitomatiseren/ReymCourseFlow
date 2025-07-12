/**
 * Session cleanup utilities to prevent auto-login issues
 */

/**
 * Clears all authentication-related data from storage
 */
export const clearAuthSession = () => {
  // Set flag to prevent auto-refresh after explicit logout
  localStorage.setItem('explicit_logout', 'true');
  
  // Clear Supabase-specific storage with correct key patterns
  const keysToRemove = Object.keys(localStorage).filter(key => 
    key.startsWith('supabase.auth.') || 
    key.startsWith('sb-lklqodxxlcndqkhldzsv') ||
    key.includes('supabase-auth-token') ||
    key.includes('auth-token')
  );
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Clear session storage as well
  const sessionKeys = Object.keys(sessionStorage).filter(key => 
    key.startsWith('supabase.auth.') || 
    key.startsWith('sb-lklqodxxlcndqkhldzsv') ||
    key.includes('auth-token')
  );
  
  sessionKeys.forEach(key => sessionStorage.removeItem(key));
};

/**
 * Checks if user explicitly logged out
 */
export const wasExplicitlyLoggedOut = (): boolean => {
  return localStorage.getItem('explicit_logout') === 'true';
};

/**
 * Clears the explicit logout flag
 */
export const clearLogoutFlag = () => {
  localStorage.removeItem('explicit_logout');
};