import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const G = 'C:/Users/anush/AppData/Roaming/npm/node_modules'

export default {
  plugins: [
    require(`${G}/tailwindcss/lib/index.js`),
    require(`${G}/autoprefixer/lib/autoprefixer.js`),
  ],
}
