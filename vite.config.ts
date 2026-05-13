// import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import react from '@vitejs/plugin-react'
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://api.seatide.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
