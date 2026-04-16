/**
 * useTheme — simple dark theme hook (kept for backward compat).
 * The app uses CSS variables exclusively so no runtime theming is needed.
 */
import { createContext, useContext } from 'react';

const ThemeContext = createContext({ theme: 'dark' });

export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={{ theme: 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
