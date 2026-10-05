import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api': 'http://localhost:3000',
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      // cms-db.json is the server's data file, written on every signup, enquiry and checkout.
      // Reloading the page on those writes would close the Razorpay window before it opens.
      watch: process.env.DISABLE_HMR === 'true' ? null : { ignored: ['**/cms-db.json', '**/cms-db.json.*.tmp'] },
    },
  };
});
