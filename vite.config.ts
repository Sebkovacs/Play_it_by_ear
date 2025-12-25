import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Cast process to any to avoid "Property 'cwd' does not exist on type 'Process'" error
  // which occurs when Node.js types are not properly loaded in the editor/build context.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for the existing code
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ""),
      // Polyfill Firebase config variables - default to empty string to prevent build/runtime errors if missing
      'process.env.NEXT_PUBLIC_FIREBASE_API_KEY': JSON.stringify(env.NEXT_PUBLIC_FIREBASE_API_KEY || ""),
      'process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ""),
      'process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID': JSON.stringify(env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ""),
      'process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ""),
      'process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ""),
      'process.env.NEXT_PUBLIC_FIREBASE_APP_ID': JSON.stringify(env.NEXT_PUBLIC_FIREBASE_APP_ID || ""),
      'process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID': JSON.stringify(env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""),
    }
  };
});