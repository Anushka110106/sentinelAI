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
      { find: /^react-router-dom$/, replacement: `${G}/react-router-dom/dist/index.js` },
      { find: /^framer-motion$/, replacement: `${G}/framer-motion/dist/framer-motion.js` },
      { find: /^axios$/, replacement: `${G}/axios/dist/axios.js` },
      { find: /^three$/, replacement: `${G}/three/build/three.module.js` },
      { find: /^three\/(.+)$/, replacement: `${G}/three/$1` },
      { find: /^@react-three\/fiber$/, replacement: `${G}/@react-three/fiber/dist/react-three-fiber.esm.js` },
      { find: /^@react-three\/drei$/, replacement: `${G}/@react-three/drei/index.js` },
      { find: /^zustand$/, replacement: `${G}/zustand/react.js` },
      { find: /^zustand\/(.+)$/, replacement: `${G}/zustand/$1.js` },
    ],
  },
  server: {
    port: 3000,
    host: true,
  },
  optimizeDeps: {
    exclude: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'axios', 'three', '@react-three/fiber', '@react-three/drei', 'zustand'],
  },
})
