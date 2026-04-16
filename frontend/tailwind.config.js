/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
      extend: {
          "colors": {
              "on-tertiary": "#ffffff",
              "on-error": "#ffffff",
              "secondary-fixed": "#ffdbcc",
              "surface-container-low": "#f4f3f3",
              "on-secondary-fixed-variant": "#7a3000",
              "tertiary": "#000000",
              "surface-tint": "#5c5d6b",
              "on-primary-fixed-variant": "#444653",
              "primary-container": "#191b26",
              "surface-container-high": "#e8e8e8",
              "secondary-container": "#fe6b00",
              "surface-container-lowest": "#ffffff",
              "primary-fixed": "#e1e1f2",
              "error": "#ba1a1a",
              "secondary-fixed-dim": "#ffb693",
              "on-tertiary-fixed-variant": "#7a3000",
              "tertiary-fixed": "#ffdbcc",
              "tertiary-fixed-dim": "#ffb693",
              "primary-fixed-dim": "#c5c5d5",
              "surface-container-highest": "#e2e2e2",
              "on-tertiary-container": "#dd5c00",
              "primary": "#000000",
              "outline-variant": "#c7c5cc",
              "on-background": "#1a1c1c",
              "surface-container": "#eeeeee",
              "tertiary-container": "#351000",
              "on-surface-variant": "#46464c",
              "on-secondary": "#ffffff",
              "inverse-on-surface": "#f1f1f1",
              "surface-bright": "#f9f9f9",
              "surface": "#f9f9f9",
              "on-error-container": "#93000a",
              "on-primary-container": "#828391",
              "on-primary-fixed": "#191b26",
              "on-secondary-fixed": "#351000",
              "inverse-primary": "#c5c5d5",
              "background": "#f9f9f9",
              "secondary": "#a04100",
              "surface-variant": "#e2e2e2",
              "on-tertiary-fixed": "#351000",
              "on-surface": "#1a1c1c",
              "outline": "#77767c",
              "on-secondary-container": "#572000",
              "surface-dim": "#dadada",
              "inverse-surface": "#2f3131",
              "error-container": "#ffdad6",
              "on-primary": "#ffffff"
          },
          "borderRadius": {
              "DEFAULT": "0px",
              "lg": "0px",
              "xl": "0px",
              "full": "0px"
          },
          "fontFamily": {
              "headline": ["Space Grotesk", "sans-serif"],
              "body": ["Inter", "sans-serif"],
              "label": ["Space Grotesk", "sans-serif"]
          },
          "boxShadow": {
              "tactical": "4px 4px 0px 0px #0D0F1A",
              "tactical-hover": "2px 2px 0px 0px #0D0F1A"
          },
          "backgroundImage": {
              'blueprint': 'linear-gradient(to right, #c7c5cc1a 1px, transparent 1px), linear-gradient(to bottom, #c7c5cc1a 1px, transparent 1px)'
          }
      }
  },
  plugins: [],
}
