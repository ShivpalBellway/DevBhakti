const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
export const API_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
export const BASE_URL = API_URL.replace('/api', '');

