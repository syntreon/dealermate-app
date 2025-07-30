/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'query-vendor': ['@tanstack/react-query'],
          'chart-vendor': ['recharts'],
          'date-vendor': ['date-fns'],
          'form-vendor': ['react-hook-form', 'zod'],
          
          // Feature-based chunks
          'admin-pages': [
            './src/pages/admin/dashboard',
            './src/pages/admin/management/client-management',
            './src/pages/admin/management/user-management',
            './src/pages/admin/settings/AdminSettings',
            './src/pages/admin/audit/admin-audit',
            './src/pages/admin/SystemHealthMonitoring',
          ],
          'main-pages': [
            './src/pages/Dashboard',
            './src/pages/Analytics',
            './src/pages/Logs',
            './src/pages/Leads',
            './src/pages/Settings',
          ],
          'auth-pages': [
            './src/pages/Login',
            './src/pages/auth/AuthCallback',
            './src/pages/auth/ResetPassword',
          ],
        },
        // Optimize chunk size
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
      },
    },
    // Optimize bundle size
    target: 'esnext',
    minify: 'esbuild',
    // Enable source maps for debugging in production
    sourcemap: mode === 'development',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
}));
