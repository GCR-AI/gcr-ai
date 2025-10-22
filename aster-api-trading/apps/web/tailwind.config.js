export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#191919',
          card: '#1F1F1F',
          border: '#2A2A2A',
          hover: '#252525',
        },
        gold: {
          DEFAULT: '#C99F6F',
          light: '#D4B185',
          dark: '#B68D5F',
        },
        profit: '#10b981',
        loss: '#ef4444',
      },
    },
  },
  plugins: [],
}
