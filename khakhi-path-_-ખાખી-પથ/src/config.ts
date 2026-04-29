// src/config.ts
export const GOOGLE_CONFIG = {
  apiKey: (import.meta as any).env.VITE_GOOGLE_API_KEY,
  clientId: (import.meta as any).env.VITE_GOOGLE_CLIENT_ID,
  appsScriptUrl: (import.meta as any).env.VITE_APPS_SCRIPT_URL,
};

// Log for debugging (optional - remove before going live!)
if (process.env.NODE_ENV !== 'production') {
  console.log("Config Loaded for Khakhi Path:", !!GOOGLE_CONFIG.apiKey);
}
