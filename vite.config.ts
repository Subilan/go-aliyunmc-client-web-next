// import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL('.', import.meta.url));

function getFrontendCommit() {
	try {
		return execSync('git rev-parse --short=7 HEAD', { cwd: rootDir }).toString().trim();
	} catch {
		return 'unknown';
	}
}

export default defineConfig({
  define: {
    __FRONTEND_COMMIT__: JSON.stringify(getFrontendCommit()),
  },
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
