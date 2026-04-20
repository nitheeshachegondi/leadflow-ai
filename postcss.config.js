const path = require('path')

// __dirname here is always the project root (where postcss.config.js lives)
// We pass the resolved config path so Tailwind finds it regardless of cwd
module.exports = {
  plugins: {
    tailwindcss: { config: path.resolve(__dirname, 'tailwind.config.js') },
    autoprefixer: {}
  }
}
