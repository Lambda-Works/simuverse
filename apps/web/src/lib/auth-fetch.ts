/**
 * Global fetch wrapper that automatically adds JWT token from localStorage
 * This patches the global fetch to include authentication headers
 */

if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' 
      ? input 
      : input instanceof URL 
        ? input.toString() 
        : (input as Request).url;
    
    // Only add token for API calls to our backend
    const isApiCall = url.includes('/api/') || 
                      url.includes('localhost:5000') || 
                      url.includes('localhost:5001') ||
                      url.includes(':5000/api') ||
                      url.includes(':5001/api');
    
    if (isApiCall) {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Create new headers object
        const newHeaders: Record<string, string> = {};
        
        // Copy existing headers
        if (init?.headers) {
          if (init.headers instanceof Headers) {
            init.headers.forEach((value, key) => {
              newHeaders[key] = value;
            });
          } else if (Array.isArray(init.headers)) {
            init.headers.forEach(([key, value]) => {
              newHeaders[key] = value;
            });
          } else {
            Object.assign(newHeaders, init.headers);
          }
        }
        
        // Add Authorization if not present
        if (!newHeaders['Authorization'] && !newHeaders['authorization']) {
          newHeaders['Authorization'] = `Bearer ${token}`;
        }
        
        return originalFetch(input, { ...init, headers: newHeaders });
      }
    }
    
    return originalFetch(input, init);
  };
  
  console.log('[auth-fetch] Global fetch patched with JWT token support');
}

export { };
