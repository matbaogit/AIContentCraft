/**
 * Environment detection utilities
 */

export function isDevelopment(): boolean {
  // Check if we're running on toolbox.vn (production)
  const hostname = process.env.REPLIT_DOMAINS || 'localhost';
  
  // If hostname contains toolbox.vn, it's production
  if (hostname.includes('toolbox.vn')) {
    return false;
  }
  
  return hostname.includes('replit.dev') || hostname.includes('localhost');
}

export function isProduction(): boolean {
  return !isDevelopment();
}

export function getCurrentDomain(): string {
  // FORCE PRODUCTION URL - Always use toolbox.vn for consistency
  return 'https://toolbox.vn';
}

export function getProxyBaseUrl(): string {
  return 'https://toolbox.vn';
}

export function getEnvironmentInfo() {
  return {
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    currentDomain: getCurrentDomain(),
    proxyBaseUrl: getProxyBaseUrl()
  };
}