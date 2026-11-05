import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkUiColors, uiColors, type UiColors } from '../theme';

export type ThemeMode = 'system' | 'light' | 'dark';
type ThemeValue = {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  colors: UiColors;
  loading: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
};

const STORAGE_KEY = 'appearance:mode';
const ThemeContext = createContext<ThemeValue | null>(null);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (active && isThemeMode(stored)) setModeState(stored);
    }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!loading) Appearance.setColorScheme(mode === 'system' ? null : mode);
  }, [mode, loading]);

  const setMode = useCallback(async (next: ThemeMode) => {
    await AsyncStorage.setItem(STORAGE_KEY, next);
    setModeState(next);
  }, []);
  const resolved = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const colors = resolved === 'dark' ? darkUiColors : uiColors;
  const value = useMemo(() => ({ mode, resolved, colors, loading, setMode }), [mode, resolved, colors, loading, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme phải được dùng bên trong <ThemeProvider>');
  return value;
}

export function useThemedStyles<T>(createStyles: (colors: UiColors) => T) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors, createStyles]);
  return { colors, styles };
}
