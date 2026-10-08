// Global API Configuration
// Automatically detects localhost vs production

const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_CONFIG = {
  BASE_URL: isDev ? 'http://localhost:8080/api/v1' : 'https://api.stopreg.com/api/v1',
  ADMIN_URL: isDev ? 'http://localhost:8080/api/v1/admin' : 'https://api.stopreg.com/api/v1/admin',
  SEO_URL: isDev ? 'http://localhost:8080/api/v1/seo' : 'https://api.stopreg.com/api/v1/seo',
};

// Helper function for constructing URLs
function getApiUrl(path, section = 'base') {
  const baseUrl = API_CONFIG[`${section.toUpperCase()}_URL`] || API_CONFIG.BASE_URL;
  return path.startsWith('/') ? baseUrl + path : baseUrl + '/' + path;
}

export { API_CONFIG, getApiUrl };
