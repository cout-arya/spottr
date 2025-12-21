/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#25F45C", // Neon Green (GymSync Brand)
                secondary: "#7000FF", // Deep Purple accent
                accent: "#00FF94", // Bright Neon Green
                dark: "#050505", // Almost black
                "dark-light": "#121212", // Slightly lighter dark
                gray: {
                    900: "#1A1A1A",
                    800: "#2A2A2A",
                    400: "#A0A0A0",
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
