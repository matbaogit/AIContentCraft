/**
 * Environment detection utilities
 */

export function isDevelopment(): boolean {
  const hostname = process.env.REPLIT_DOMAINS || 'localhost';
  return hostname.includes('replit.dev') || hostname.includes('localhost');
}

export function isProduction(): boolean {
  return !isDevelopment();
}

export function getCurrentDomain(): string {
  if (isDevelopment()) {
    const replitDomains = process.env.REPLIT_DOMAINS;
    if (replitDomains) {
      return `https://${replitDomains.split(',')[0]}`;
    }
    return 'http://localhost:5000';
  }
  // Production domain
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