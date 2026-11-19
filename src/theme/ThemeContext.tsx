import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { darkColors, lightColors, ThemeColors } from './colors';

type Mode = 'light' | 'dark';
const STORAGE_KEY = 'unisurvival_theme_mode';

type ThemeContextValue = {
  mode: Mode;
  colors: ThemeColors;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') setMode(saved);
      setReady(true);
    });
  }, []);

  const toggleTheme = () => {
    setMode((prev) => {
      const next: Mode = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  const colors = mode === 'dark' ? darkColors : lightColors;

  if (!ready) return null;

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be called inside a ThemeProvider');
  }
  return context;
}
