// Utility functions for API calls through proxy to bypass CORS

export const proxyFetch = async (endpoint, options = {}) => {
  const { method = 'GET', body, token, ...fetchOptions } = options;
  
  if (method === 'GET') {
    const params = new URLSearchParams();
    params.append('endpoint', endpoint);
    if (token) params.append('token', token);
    
    return fetch(`/api/proxy?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers
      }
    });
  } else {
    return fetch('/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers
      },
      body: JSON.stringify({
        endpoint,
        method,
        ...body
      })
    });
  }
};

// Specific auth functions
export const authAPI = {
  login: async (email, password) => {
    return proxyFetch('/api/auth/login-tenant', {
      method: 'POST',
      body: { email: email.trim(), password: password.trim() }
    });
  },
  
  register: async (formData) => {
    return proxyFetch('/api/auth/register-tenant', {
      method: 'POST',
      body: formData
    });
  },
  
  validateToken: async (token) => {
    return proxyFetch('/api/auth/validate-token', {
      method: 'POST',
      token
    });
  }
};

export default proxyFetch;