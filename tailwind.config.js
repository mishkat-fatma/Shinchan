/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        },
        drift: {
          "0%": { transform: "translateX(-10%)" },
          "100%": { transform: "translateX(110%)" }
        },
        wiggle: {
          "0%,100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(6deg)" },
          "75%": { transform: "rotate(-6deg)" }
        },
        glow: {
          "0%,100%": { boxShadow: "0 0 0 rgba(0,0,0,0)" },
          "50%": { boxShadow: "0 0 35px rgba(255, 255, 255, 0.6)" }
        }
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        drift: "drift 50s linear infinite",
        wiggle: "wiggle 0.6s ease-in-out",
        glow: "glow 2s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
