export const API_BASE = (
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '')
).replace(/\/+$/, '');

export const api = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const { headers: suppliedHeaders = {}, body, ...requestOptions } = options;
  const headers = {
    ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...suppliedHeaders,
  };

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...requestOptions,
      body,
      headers,
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) throw new Error(data?.message || `Request failed (${response.status}).`);
  return data;
};
