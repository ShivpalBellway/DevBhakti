const isBrowser = typeof window !== 'undefined';
// const host = isBrowser ? window.location.origin : "http://localhost:5001";
const host = isBrowser ? window.location.origin : "http://localhost:5000";
const rawUrl = process.env.NEXT_PUBLIC_API_URL || `${host}/api`;
export const API_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
export const BASE_URL = API_URL.replace('/api', '');

