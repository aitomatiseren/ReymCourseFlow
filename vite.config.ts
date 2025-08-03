import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: 'localhost',
    port: 3000,
    strictPort: true,
    watch: {
      usePolling: true  // Better for WSL
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize bundle size
    target: 'esnext',
    minify: mode === 'production' ? 'esbuild' : false,
    // Remove console statements in production
    esbuild: mode === 'production' ? {
      drop: ['console', 'debugger'],
    } : undefined,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and related libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI chunk for component libraries
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            'lucide-react'
          ],
          // Data management chunk
          data: ['@tanstack/react-query', '@supabase/supabase-js'],
          // Calendar and date utilities
          calendar: [
            '@fullcalendar/core',
            '@fullcalendar/react',
            '@fullcalendar/daygrid',
            '@fullcalendar/timegrid',
            'date-fns'
          ],
          // Forms and validation
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Charts and visualization
          charts: ['recharts'],
          // PDF and document processing
          documents: ['pdfjs-dist']
        },
      },
    },
    // Increase chunk size warning limit since we're using manual chunks
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react',
      'date-fns',
      'zod'
    ],
  },
}));
