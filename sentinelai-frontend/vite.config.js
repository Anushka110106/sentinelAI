// Import from global npm to avoid Google Drive node_modules corruption
import { defineConfig } from 'file:///C:/Users/anush/AppData/Roaming/npm/node_modules/vite/dist/node/index.js'
import react from 'file:///C:/Users/anush/AppData/Roaming/npm/node_modules/@vitejs/plugin-react/dist/index.js'
import { createRequire } from 'module'
import path from 'path'

const G = 'C:/Users/anush/AppData/Roaming/npm/node_modules'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
    // Use regex alias to handle all sub-paths correctly (e.g. react/jsx-runtime)
    alias: [
      { find: /^react\/(.+)$/, replacement: `${G}/react/$1` },
      { find: /^react$/, replacement: `${G}/react/index.js` },
      { find: /^react-dom\/(.+)$/, replacement: `${G}/react-dom/$1` },
      { find: /^react-dom$/, replacement: `${G}/react-dom/index.js` },
      { find: /^react-router-dom$/, replacement: `${G}/react-router-dom/dist/index.mjs` },
      { find: /^react-router\/dom$/, replacement: `${G}/react-router-dom/node_modules/react-router/dist/production/dom-export.mjs` },
      { find: /^react-router$/, replacement: `${G}/react-router-dom/node_modules/react-router/dist/production/index.mjs` },
      { find: /^use-sync-external-store\/(.+)$/, replacement: `${G}/@react-three/fiber/node_modules/use-sync-external-store/$1` },
      { find: /^use-sync-external-store$/, replacement: `${G}/@react-three/fiber/node_modules/use-sync-external-store/index.js` },
      { find: /^framer-motion$/, replacement: `${G}/framer-motion/dist/es/index.mjs` },
      { find: /^framer-motion\/(.+)$/, replacement: `${G}/framer-motion/dist/es/$1.mjs` },
      { find: /^axios$/, replacement: `${G}/axios/dist/axios.js` },
      { find: /^three$/, replacement: `${G}/three/build/three.module.js` },
      { find: /^three\/(.+)$/, replacement: `${G}/three/$1` },
      { find: /^@react-three\/fiber$/, replacement: `${G}/@react-three/fiber/dist/react-three-fiber.esm.js` },
      { find: /^@react-three\/drei$/, replacement: `${G}/@react-three/drei/index.js` },
      { find: /^zustand$/, replacement: `${G}/zustand/esm/index.mjs` },
      { find: /^zustand\/(.+)$/, replacement: `${G}/zustand/esm/$1.mjs` },
    ],
  },
  server: {
    port: 3000,
    host: true,
  },
  optimizeDeps: {
    exclude: [],
  },
})

