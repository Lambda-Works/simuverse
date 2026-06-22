/**
 * API base URL — usa NEXT_PUBLIC_API_URL del .env.local, fallback a localhost:5001
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
